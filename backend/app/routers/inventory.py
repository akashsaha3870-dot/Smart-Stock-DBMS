from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.inventory import Inventory
from app.models.product import Product

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"]
)


class InventoryCreate(BaseModel):
    product_id: int
    quantity: int = Field(ge=0)
    reserved_quantity: int = Field(default=0, ge=0)


class InventoryResponse(BaseModel):
    inventory_id: int
    product_id: int
    quantity: int
    reserved_quantity: int

    class Config:
        from_attributes = True

        
class InventoryUpdate(BaseModel):
    quantity: int | None = Field(default=None, ge=0)
    reserved_quantity: int | None = Field(default=None, ge=0)



@router.post("/", response_model=InventoryResponse, status_code=201)
def create_inventory(
    data: InventoryCreate,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.product_id == data.product_id
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    existing = db.query(Inventory).filter(
        Inventory.product_id == data.product_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Inventory record already exists for this product"
        )

    if data.reserved_quantity > data.quantity:
        raise HTTPException(
            status_code=400,
            detail="Reserved quantity cannot exceed total quantity"
        )

    inventory = Inventory(
        product_id=data.product_id,
        quantity=data.quantity,
        reserved_quantity=data.reserved_quantity
    )

    db.add(inventory)
    db.commit()
    db.refresh(inventory)

    return inventory


@router.get("/", response_model=list[InventoryResponse])
def list_inventory(db: Session = Depends(get_db)):
    return db.query(Inventory).all()


@router.get("/{product_id}", response_model=InventoryResponse)
def get_inventory(
    product_id: int,
    db: Session = Depends(get_db)
):
    inventory = db.query(Inventory).filter(
        Inventory.product_id == product_id
    ).first()

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory record not found"
        )

    return inventory


@router.patch("/{product_id}", response_model=InventoryResponse)
def update_inventory(
    product_id: int,
    data: InventoryUpdate,
    db: Session = Depends(get_db)
):
    inventory = db.query(Inventory).filter(
        Inventory.product_id == product_id
    ).first()

    if inventory is None:
        raise HTTPException(
            status_code=404,
            detail="Inventory record not found"
        )

    updates = data.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one field to update"
        )

    quantity = updates.get("quantity", inventory.quantity)
    reserved = updates.get(
        "reserved_quantity", inventory.reserved_quantity
    )

    if reserved > quantity:
        raise HTTPException(
            status_code=400,
            detail="Reserved quantity cannot exceed total quantity"
        )

    for field, value in updates.items():
        if value is None:
            raise HTTPException(
                status_code=422,
                detail=f"{field} cannot be null"
            )
        setattr(inventory, field, value)

    db.commit()
    db.refresh(inventory)

    return inventory
