from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database import Base


class Sale(Base):
    __tablename__ = "sales"

    sale_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    customer_id = Column(
        Integer,
        ForeignKey("customers.customer_id"),
        nullable=True
    )

    total_amount = Column(
        Numeric(12, 2),
        nullable=False
    )

    sale_date = Column(
        DateTime,
        server_default=func.now()
    )