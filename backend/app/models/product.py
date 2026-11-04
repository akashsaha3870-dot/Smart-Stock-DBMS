from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True, index=True)

    product_name = Column(String(150), nullable=False)

    category_id = Column(
        Integer,
        ForeignKey("categories.category_id"),
        nullable=False
    )

    supplier_id = Column(
        Integer,
        ForeignKey("suppliers.supplier_id"),
        nullable=False
    )

    sku = Column(String(50), unique=True, nullable=False)

    unit_price = Column(Numeric(10, 2), nullable=False)

    cost_price = Column(Numeric(10, 2), nullable=False)

    reorder_level = Column(Integer, default=0)

    shelf_life_days = Column(Integer)

    is_active = Column(Boolean, default=True)