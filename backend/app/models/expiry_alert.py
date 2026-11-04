
from sqlalchemy import Column, Integer, DateTime, String, Text, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class ExpiryAlert(Base):
    __tablename__ = "expiry_alerts"

    alert_id = Column(Integer, primary_key=True, index=True)

    batch_id = Column(
        Integer,
        ForeignKey("inventory_batches.batch_id"),
        nullable=False
    )

    days_remaining = Column(Integer, nullable=False)

    risk_level = Column(String(20), nullable=False)
    suggested_action = Column(Text, nullable=True)

    status = Column(String(30), nullable=True, default="active")
    created_at = Column(DateTime, server_default=func.now())
