
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.purchase_items import PurchaseItem
from app.models.purchases import Purchase
from app.models.product import Product

router = APIRouter(
    prefix="/purchase-items",
    tags=["Purchase Items"]
)


class PurchaseItemCreate(BaseModel):
    purchase_id: int = Field(gt=0)
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)
    unit_cost: Decimal = Field(ge=0, max_digits=10, decimal_places=2)


class PurchaseItemResponse(BaseModel):
    purchase_item_id: int
    purchase_id: int
    product_id: int
    quantity: int
    unit_cost: Decimal
    subtotal: Decimal

    model_config = ConfigDict(from_attributes=True)


@router.post("/", response_model=PurchaseItemResponse, status_code=201)
def create_purchase_item(
    data: PurchaseItemCreate,
    db: Session = Depends(get_db)
):
    purchase = db.query(Purchase).filter(
        Purchase.purchase_id == data.purchase_id
    ).first()

    if purchase is None:
        raise HTTPException(status_code=404, detail="Purchase not found")

    product = db.query(Product).filter(
        Product.product_id == data.product_id
    ).first()

    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    subtotal = data.quantity * data.unit_cost

    item = PurchaseItem(
        purchase_id=data.purchase_id,
        product_id=data.product_id,
        quantity=data.quantity,
        unit_cost=data.unit_cost,
        subtotal=subtotal
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@router.get("/", response_model=list[PurchaseItemResponse])
def list_purchase_items(db: Session = Depends(get_db)):
    return db.query(PurchaseItem).order_by(
        PurchaseItem.purchase_item_id.desc()
    ).all()


@router.get("/{purchase_item_id}", response_model=PurchaseItemResponse)
def get_purchase_item(
    purchase_item_id: int,
    db: Session = Depends(get_db)
):
    item = db.query(PurchaseItem).filter(
        PurchaseItem.purchase_item_id == purchase_item_id
    ).first()

    if item is None:
        raise HTTPException(status_code=404, detail="Purchase item not found")

    return item
