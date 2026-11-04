from sqlalchemy import Column, Integer, Numeric, ForeignKey
from app.database import Base


class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    purchase_item_id = Column(Integer, primary_key=True, index=True)

    purchase_id = Column(
        Integer,
        ForeignKey("purchases.purchase_id"),
        nullable=False
    )

    product_id = Column(
        Integer,
        ForeignKey("products.product_id"),
        nullable=False
    )

    quantity = Column(
        Integer,
        nullable=False
    )

    unit_cost = Column(
        Numeric(10, 2),
        nullable=False
    )

    subtotal = Column(
        Numeric(12, 2),
        nullable=False
    )