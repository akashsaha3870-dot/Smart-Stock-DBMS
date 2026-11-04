from sqlalchemy import Column, Integer, Numeric, DateTime, String, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class ReorderRecommendation(Base):
    __tablename__ = "reorder_recommendations"

    recommendation_id = Column(Integer, primary_key=True, index=True)

    product_id = Column(
        Integer,
        ForeignKey("products.product_id"),
        nullable=False
    )

    current_stock = Column(Integer, nullable=False)

    predicted_demand = Column(Integer, nullable=False)

    recommended_quantity = Column(Integer, nullable=False)

    priority = Column(
        String(20),
        nullable=False,
        default="medium"
    )

    reason = Column(String(500), nullable=True)

    created_at = Column(
        DateTime,
        server_default=func.now()
    )