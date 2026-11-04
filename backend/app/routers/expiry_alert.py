from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.inventory_batch import InventoryBatch
from app.models.expiry_alert import ExpiryAlert

router = APIRouter(
    prefix="/expiry-alerts",
    tags=["Expiry Alerts"]
)


class ExpiryAlertResponse(BaseModel):
    alert_id: int
    batch_id: int
    product_id: int
    expiry_date: date
    days_remaining: int
    alert_level: str
    status: str


def get_alert_level(days_remaining: int) -> str:
    if days_remaining < 0:
        return "critical"
    elif days_remaining <= 3:
        return "critical"
    elif days_remaining <= 7:
        return "warning"
    return "safe"


def to_expiry_alert_response(
    alert: ExpiryAlert,
    product_id: int,
    expiry_date: date
) -> ExpiryAlertResponse:
    return ExpiryAlertResponse(
        alert_id=alert.alert_id,
        batch_id=alert.batch_id,
        product_id=product_id,
        expiry_date=expiry_date,
        days_remaining=alert.days_remaining,
        alert_level=get_alert_level(alert.days_remaining),
        status=alert.status
    )


def get_risk_level(alert_level: str) -> str:
    return {
        "critical": "critical",
        "warning": "medium",
        "safe": "low"
    }[alert_level]


@router.post("/generate", response_model=list[ExpiryAlertResponse])
def generate_expiry_alerts(db: Session = Depends(get_db)):
    today = date.today()

    batches = db.query(
        InventoryBatch.batch_id,
        InventoryBatch.product_id,
        InventoryBatch.expiry_date
    ).filter(
        InventoryBatch.quantity > 0
    ).all()

    generated_alerts = []

    for batch in batches:
        days_remaining = (batch.expiry_date - today).days
        alert_level = get_alert_level(days_remaining)
        risk_level = get_risk_level(alert_level)

        existing_alert = db.query(ExpiryAlert).filter(
            ExpiryAlert.batch_id == batch.batch_id,
            ExpiryAlert.status == "active"
        ).first()

        if existing_alert:
            existing_alert.days_remaining = days_remaining
            existing_alert.risk_level = risk_level
            existing_alert.suggested_action = (
                "Remove expired stock immediately"
                if days_remaining < 0
                else "Prioritize sale and monitor stock"
                if days_remaining <= 5
                else "Monitor expiry date"
            )
        else:
            existing_alert = ExpiryAlert(
                batch_id=batch.batch_id,
                days_remaining=days_remaining,
                risk_level=risk_level,
                suggested_action=(
                    "Remove expired stock immediately"
                    if days_remaining < 0
                    else "Prioritize sale and monitor stock"
                    if days_remaining <= 5
                    else "Monitor expiry date"
                ),
                status="active"
            )
            db.add(existing_alert)

        generated_alerts.append((existing_alert, batch))

    db.commit()

    responses = []
    for alert, batch in generated_alerts:
        db.refresh(alert)
        responses.append(
            to_expiry_alert_response(
                alert,
                product_id=batch.product_id,
                expiry_date=batch.expiry_date
            )
        )

    return responses


@router.get("/", response_model=list[ExpiryAlertResponse])
def list_expiry_alerts(db: Session = Depends(get_db)):
    rows = db.query(
        ExpiryAlert,
        InventoryBatch.product_id,
        InventoryBatch.expiry_date
    ).join(
        InventoryBatch,
        InventoryBatch.batch_id == ExpiryAlert.batch_id
    ).filter(
        ExpiryAlert.status == "active"
    ).order_by(
        ExpiryAlert.days_remaining.asc()
    ).all()
    return [
        to_expiry_alert_response(
            alert,
            product_id=product_id,
            expiry_date=expiry_date
        )
        for alert, product_id, expiry_date in rows
    ]


@router.patch("/{alert_id}/resolve")
def resolve_expiry_alert(
    alert_id: int,
    db: Session = Depends(get_db)
):
    alert = db.query(ExpiryAlert).filter(
        ExpiryAlert.alert_id == alert_id
    ).first()

    if alert is None:
        raise HTTPException(
            status_code=404,
            detail="Expiry alert not found"
        )

    alert.status = "resolved"
    db.commit()

    return {
        "message": "Expiry alert resolved successfully",
        "alert_id": alert_id,
        "status": alert.status
    }
