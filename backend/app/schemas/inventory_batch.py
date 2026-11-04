from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class InventoryBatchCreate(BaseModel):
    product_id: int = Field(gt=0)
    batch_number: str = Field(min_length=1, max_length=100)
    quantity: int = Field(gt=0)
    received_date: date
    expiry_date: date
    unit_cost: Decimal = Field(ge=0, max_digits=10, decimal_places=2)


class InventoryBatchResponse(BaseModel):
    batch_id: int
    product_id: int
    batch_number: str
    quantity: int
    received_date: date
    expiry_date: date
    unit_cost: Decimal

    model_config = ConfigDict(from_attributes=True)