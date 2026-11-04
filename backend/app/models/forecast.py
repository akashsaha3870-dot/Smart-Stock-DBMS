from sqlalchemy import Column, Integer, Date, Numeric, ForeignKey, DateTime, String, func
from app.database import Base


class Forecast(Base):
    __tablename__ = "forecasts"

    forecast_id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    product_id = Column(
        Integer,
        ForeignKey("products.product_id"),
        nullable=False
    )

    forecast_date = Column(
        Date,
        nullable=False
    )

    predicted_quantity = Column(
        Numeric(12, 2),
        nullable=False
    )

    model_name = Column(
        String(100),
        nullable=False
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )