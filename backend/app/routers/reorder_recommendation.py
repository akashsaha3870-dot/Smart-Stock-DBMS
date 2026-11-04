
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product
from app.models.inventory import Inventory

router = APIRouter(
    prefix="/reorder-recommendations",
    tags=["Reorder Recommendations"]
)


@router.get("/")
def get_reorder_recommendations(
    db: Session = Depends(get_db)
):
    products = db.query(Product).filter(
        Product.is_active == True
    ).all()

    recommendations = []

    for product in products:
        inventory = db.query(Inventory).filter(
            Inventory.product_id == product.product_id
        ).first()

        quantity = inventory.quantity if inventory else 0
        reserved = inventory.reserved_quantity if inventory else 0

        available_stock = max(0, quantity - reserved)
        reorder_level = product.reorder_level or 0

        if available_stock <= reorder_level:
            # Simple rule-based target: replenish to twice the reorder level.
            target_stock = max(2 * reorder_level, 1)
            suggested_quantity = max(0, target_stock - available_stock)

            recommendations.append({
                "product_id": product.product_id,
                "product_name": product.product_name,
                "sku": product.sku,
                "available_stock": available_stock,
                "reorder_level": reorder_level,
                "target_stock": target_stock,
                "suggested_quantity": suggested_quantity,
                "supplier_id": product.supplier_id,
                "estimated_cost": round(
                    float(product.cost_price) * suggested_quantity, 2
                ),
                "reason": "Available stock is at or below reorder level"
            })

    return recommendations
