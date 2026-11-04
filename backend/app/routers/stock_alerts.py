
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product
from app.models.inventory import Inventory

router = APIRouter(
    prefix="/stock-alerts",
    tags=["Stock Alerts"]
)


@router.get("/")
def get_low_stock_products(db: Session = Depends(get_db)):
    products = db.query(Product).filter(
        Product.is_active == True
    ).all()

    alerts = []

    for product in products:
        inventory = db.query(Inventory).filter(
            Inventory.product_id == product.product_id
        ).first()

        current_quantity = inventory.quantity if inventory else 0
        reorder_level = product.reorder_level or 0

        if current_quantity <= reorder_level:
            alerts.append({
                "product_id": product.product_id,
                "product_name": product.product_name,
                "sku": product.sku,
                "current_quantity": current_quantity,
                "reorder_level": reorder_level,
                "shortage": max(0, reorder_level - current_quantity),
                "supplier_id": product.supplier_id,
                "alert": "LOW STOCK"
            })

    return alerts


@router.get("/count")
def get_low_stock_count(db: Session = Depends(get_db)):
    products = db.query(Product).filter(
        Product.is_active == True
    ).all()

    count = 0

    for product in products:
        inventory = db.query(Inventory).filter(
            Inventory.product_id == product.product_id
        ).first()

        current_quantity = inventory.quantity if inventory else 0
        reorder_level = product.reorder_level or 0

        if current_quantity <= reorder_level:
            count += 1

    return {"low_stock_count": count}
