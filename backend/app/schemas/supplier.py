from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SupplierBase(BaseModel):
    supplier_name: str
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    supplier_name: str | None = None
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None


class SupplierResponse(SupplierBase):
    model_config = ConfigDict(from_attributes=True)

    supplier_id: int
    created_at: datetime | None = None