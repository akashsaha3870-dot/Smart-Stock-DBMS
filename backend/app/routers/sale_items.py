
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from decimal import Decimal

from app.database import get_db
from app.models.sales import Sale
from app.models.sale_items import SaleItem
from app.models.inventory import Inventory
from app.models.product import Product

router = APIRouter(
    prefix="/sale-items",
    tags=["Sale Items"]
)


class SaleItemCreate(BaseModel):
    sale_id: int = Field(gt=0)
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)


class SaleItemResponse(BaseModel):
    sale_item_id: int
    sale_id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    subtotal: Decimal

    class Config:
        from_attributes = True


@router.post("/", response_model=SaleItemResponse, status_code=201)
def create_sale_item(
    data: SaleItemCreate,
    db: Session = Depends(get_db)
):
    sale = db.query(Sale).filter(
        Sale.sale_id == data.sale_id
    ).first()

    if sale is None:
        raise HTTPException(404, "Sale not found")

    product = db.query(Product).filter(
        Product.product_id == data.product_id,
        Product.is_active == True
    ).first()

    if product is None:
        raise HTTPException(404, "Active product not found")

    inventory = db.query(Inventory).filter(
        Inventory.product_id == data.product_id
    ).with_for_update().first()

    if inventory is None:
        raise HTTPException(404, "Inventory record not found")

    available = inventory.quantity - inventory.reserved_quantity

    if available < data.quantity:
        raise HTTPException(
            400,
            f"Insufficient stock. Available: {available}"
        )

    unit_price = Decimal(str(product.unit_price))
    subtotal = unit_price * data.quantity

    try:
        item = SaleItem(
            sale_id=data.sale_id,
            product_id=data.product_id,
            quantity=data.quantity,
            unit_price=unit_price,
            subtotal=subtotal
        )

        inventory.quantity -= data.quantity
        sale.total_amount = Decimal(str(sale.total_amount)) + subtotal

        db.add(item)
        db.commit()
        db.refresh(item)

        return item

    except Exception:
        db.rollback()
        raise


@router.get("/")
def list_sale_items(db: Session = Depends(get_db)):
    try:
        items = db.query(SaleItem).all()

        return [
            {
                "sale_item_id": item.sale_item_id,
                "sale_id": item.sale_id,
                "product_id": item.product_id,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "subtotal": float(item.subtotal)
            }
            for item in items
        ]

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/{sale_item_id}", response_model=SaleItemResponse)
def get_sale_item(
    sale_item_id: int,
    db: Session = Depends(get_db)
):
    item = db.query(SaleItem).filter(
        SaleItem.sale_item_id == sale_item_id
    ).first()

    if item is None:
        raise HTTPException(404, "Sale item not found")

    return item
