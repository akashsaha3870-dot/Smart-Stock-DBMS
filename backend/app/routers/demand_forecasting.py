
from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db

router = APIRouter(
    prefix="/demand-forecast",
    tags=["Demand Forecasting"]
)


@router.get("/")
def forecast_demand(
    forecast_days: int = Query(default=7, ge=1, le=30),
    db: Session = Depends(get_db)
):
    query = text("""
        SELECT
            p.product_id,
            p.product_name,
            p.sku,
            p.cost_price,
            COALESCE(SUM(si.quantity), 0) AS total_sold
        FROM products p
        LEFT JOIN sale_items si
            ON si.product_id = p.product_id
        LEFT JOIN sales s
            ON s.sale_id = si.sale_id
            AND s.sale_date >= CURRENT_DATE - INTERVAL '13 days'
            AND s.sale_date < CURRENT_DATE + INTERVAL '1 day'
        WHERE p.is_active = TRUE
        GROUP BY
            p.product_id,
            p.product_name,
            p.sku,
            p.cost_price
        ORDER BY p.product_id
    """)

    rows = db.execute(query).mappings().all()
    forecasts = []

    for row in rows:
        total_sold = int(row["total_sold"] or 0)

        # Baseline: average sales across 14 calendar days
        average_daily_demand = total_sold / 14
        predicted_demand = round(
            average_daily_demand * forecast_days
        )

        forecasts.append({
            "product_id": row["product_id"],
            "product_name": row["product_name"],
            "sku": row["sku"],
            "historical_units_sold_14_days": total_sold,
            "average_daily_demand": round(
                average_daily_demand, 2
            ),
            "forecast_days": forecast_days,
            "predicted_units": predicted_demand,
            "estimated_purchase_cost": round(
                float(row["cost_price"] or 0)
                * predicted_demand, 2
            ),
            "method": "14-day average demand baseline"
        })

    return {
        "forecast_method": "14-day average",
        "products_forecasted": len(forecasts),
        "forecasts": forecasts
    }
