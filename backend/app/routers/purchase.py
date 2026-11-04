from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.purchases import Purchase
from app.models.supplier import Supplier
from app.models.purchase_items import PurchaseItem
from app.models.inventory import Inventory

router = APIRouter(
    prefix="/purchases",
    tags=["Purchases"]
)


class PurchaseCreate(BaseModel):
    supplier_id: int = Field(gt=0)
    total_amount: Decimal = Field(
        ge=0, max_digits=12, decimal_places=2
    )
    status: str = "pending"


class PurchaseStatusUpdate(BaseModel):
    status: str = Field(min_length=1, max_length=30)


class PurchaseResponse(BaseModel):
    purchase_id: int
    supplier_id: int
    total_amount: Decimal
    purchase_date: datetime | None = None
    status: str

    model_config = ConfigDict(from_attributes=True)


@router.post("/", response_model=PurchaseResponse, status_code=201)
def create_purchase(
    data: PurchaseCreate,
    db: Session = Depends(get_db)
):
    supplier = db.query(Supplier).filter(
        Supplier.supplier_id == data.supplier_id
    ).first()

    if supplier is None:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    purchase = Purchase(**data.model_dump())
    db.add(purchase)
    db.commit()
    db.refresh(purchase)

    return purchase


@router.get("/", response_model=list[PurchaseResponse])
def list_purchases(db: Session = Depends(get_db)):
    return db.query(Purchase).order_by(
        Purchase.purchase_id.desc()
    ).all()


@router.get("/{purchase_id}", response_model=PurchaseResponse)
def get_purchase(
    purchase_id: int,
    db: Session = Depends(get_db)
):
    purchase = db.query(Purchase).filter(
        Purchase.purchase_id == purchase_id
    ).first()

    if purchase is None:
        raise HTTPException(
            status_code=404,
            detail="Purchase not found"
        )

    return purchase



@router.patch("/{purchase_id}/status", response_model=PurchaseResponse)
def update_purchase_status(
    purchase_id: int,
    data: PurchaseStatusUpdate,
    db: Session = Depends(get_db)
):
    purchase = db.query(Purchase).filter(
        Purchase.purchase_id == purchase_id
    ).with_for_update().first()

    if purchase is None:
        raise HTTPException(
            status_code=404,
            detail="Purchase not found"
        )

    allowed_statuses = {
        "pending", "approved", "received", "cancelled"
    }

    if data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Status must be pending, approved, received, or cancelled"
        )

    # Prevent receiving the same purchase twice.
    if purchase.status == "received" and data.status == "received":
        raise HTTPException(
            status_code=400,
            detail="This purchase has already been received"
        )

    # Stock can only be received from an approved purchase.
    if data.status == "received":
        if purchase.status != "approved":
            raise HTTPException(
                status_code=400,
                detail="Approve the purchase before marking it received"
            )

        items = db.query(PurchaseItem).filter(
            PurchaseItem.purchase_id == purchase_id
        ).all()

        if not items:
            raise HTTPException(
                status_code=400,
                detail="Cannot receive a purchase with no items"
            )

        for item in items:
            inventory = db.query(Inventory).filter(
                Inventory.product_id == item.product_id
            ).with_for_update().first()

            if inventory is None:
                inventory = Inventory(
                    product_id=item.product_id,
                    quantity=item.quantity,
                    reserved_quantity=0
                )
                db.add(inventory)
            else:
                inventory.quantity += item.quantity

    purchase.status = data.status

    try:
        db.commit()
        db.refresh(purchase)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Could not update purchase status; transaction rolled back"
        )

    return purchase
