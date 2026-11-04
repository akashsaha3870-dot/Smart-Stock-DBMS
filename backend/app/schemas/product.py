
from pydantic import BaseModel, ConfigDict, Field
from decimal import Decimal


class ProductBase(BaseModel):
    product_name: str = Field(min_length=1, max_length=150)
    category_id: int = Field(gt=0)
    supplier_id: int = Field(gt=0)
    sku: str = Field(min_length=1, max_length=50)
    unit_price: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    cost_price: Decimal = Field(ge=0, max_digits=10, decimal_places=2)
    reorder_level: int = Field(default=0, ge=0)
    shelf_life_days: int | None = Field(default=None, gt=0)
    is_active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    product_name: str | None = Field(default=None, min_length=1, max_length=150)
    category_id: int | None = Field(default=None, gt=0)
    supplier_id: int | None = Field(default=None, gt=0)
    sku: str | None = Field(default=None, min_length=1, max_length=50)
    unit_price: Decimal | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    cost_price: Decimal | None = Field(default=None, ge=0, max_digits=10, decimal_places=2)
    reorder_level: int | None = Field(default=None, ge=0)
    shelf_life_days: int | None = Field(default=None, gt=0)
    is_active: bool | None = None


class ProductResponse(ProductBase):
    product_id: int

    model_config = ConfigDict(from_attributes=True)
