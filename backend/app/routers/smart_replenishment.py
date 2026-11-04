
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter(
    prefix="/smart-replenishment",
    tags=["Smart Replenishment"]
)


@router.get("/")
def get_smart_replenishment(
    db: Session = Depends(get_db)
):
    query = text("""
        SELECT
            p.product_id,
            p.product_name,
            p.sku,
            p.cost_price,
            COALESCE(i.quantity, 0) AS quantity,
            COALESCE(i.reserved_quantity, 0) AS reserved_quantity,
            COALESCE(p.reorder_level, 0) AS reorder_level,
            COALESCE(SUM(
                CASE
                    WHEN s.sale_date >= CURRENT_DATE - INTERVAL '13 days'
                     AND s.sale_date < CURRENT_DATE + INTERVAL '1 day'
                    THEN si.quantity
                    ELSE 0
                END
            ), 0) AS total_sold
        FROM products p
        LEFT JOIN inventory i
            ON i.product_id = p.product_id
        LEFT JOIN sale_items si
            ON si.product_id = p.product_id
        LEFT JOIN sales s
            ON s.sale_id = si.sale_id
        WHERE p.is_active = TRUE
        GROUP BY
            p.product_id, p.product_name, p.sku, p.cost_price,
            i.quantity, i.reserved_quantity, p.reorder_level
        ORDER BY p.product_id
    """)

    rows = db.execute(query).mappings().all()
    recommendations = []

    for row in rows:
        available_stock = max(
            0,
            int(row["quantity"]) - int(row["reserved_quantity"])
        )
        daily_demand = int(row["total_sold"] or 0) / 14

        # Target stock covers 14 days of estimated demand,
        # or at least twice the configured reorder level.
        target_stock = max(
            int(daily_demand * 14),
            int(row["reorder_level"]) * 2
        )

        suggested_quantity = max(
            0, target_stock - available_stock
        )

        if suggested_quantity > 0:
            recommendations.append({
                "product_id": row["product_id"],
                "product_name": row["product_name"],
                "sku": row["sku"],
                "available_stock": available_stock,
                "average_daily_demand": round(daily_demand, 2),
                "target_stock": target_stock,
                "suggested_order_quantity": suggested_quantity,
                "estimated_order_cost": round(
                    float(row["cost_price"] or 0)
                    * suggested_quantity, 2
                ),
                "reason": (
                    "Stock is below the target based on "
                    "recent demand and reorder level."
                )
            })

    return {
        "recommendations_count": len(recommendations),
        "recommendations": recommendations
    }
