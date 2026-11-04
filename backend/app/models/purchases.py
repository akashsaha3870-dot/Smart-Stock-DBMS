from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, func
from sqlalchemy.sql import func

from app.database import Base


class Purchase(Base):
    __tablename__ = "purchases"

    purchase_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    supplier_id = Column(
        Integer,
        ForeignKey("suppliers.supplier_id"),
        nullable=False
    )

    total_amount = Column(
        Numeric(12, 2),
        nullable=False
    )

    purchase_date = Column(
        DateTime,
        server_default=func.now()
    )

    status = Column(
        String(30),
        nullable=False,
        default="pending"
    )