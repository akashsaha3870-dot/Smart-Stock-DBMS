from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import (
    SupplierCreate,
    SupplierUpdate,
    SupplierResponse,
)

router = APIRouter(
    prefix="/suppliers",
    tags=["Suppliers"]
)


# CREATE SUPPLIER
@router.post(
    "/",
    response_model=SupplierResponse,
    status_code=status.HTTP_201_CREATED
)
def create_supplier(
    data: SupplierCreate,
    db: Session = Depends(get_db)
):
    supplier = Supplier(**data.model_dump())

    db.add(supplier)

    try:
        db.commit()
        db.refresh(supplier)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Could not create supplier because of a database conflict"
        )

    return supplier


# GET ALL SUPPLIERS
@router.get(
    "/",
    response_model=list[SupplierResponse]
)
def get_suppliers(db: Session = Depends(get_db)):
    return db.query(Supplier).order_by(
        Supplier.supplier_id.desc()
    ).all()


# GET SUPPLIER BY ID
@router.get(
    "/{supplier_id}",
    response_model=SupplierResponse
)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):
    supplier = db.query(Supplier).filter(
        Supplier.supplier_id == supplier_id
    ).first()

    if supplier is None:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    return supplier


# UPDATE SUPPLIER
@router.patch(
    "/{supplier_id}",
    response_model=SupplierResponse
)
def update_supplier(
    supplier_id: int,
    data: SupplierUpdate,
    db: Session = Depends(get_db)
):
    supplier = db.query(Supplier).filter(
        Supplier.supplier_id == supplier_id
    ).first()

    if supplier is None:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    updates = data.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one field to update"
        )

    if "supplier_name" in updates and not updates["supplier_name"]:
        raise HTTPException(
            status_code=400,
            detail="Supplier name cannot be empty"
        )

    for field, value in updates.items():
        setattr(supplier, field, value)

    try:
        db.commit()
        db.refresh(supplier)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Could not update supplier because of a database conflict"
        )

    return supplier


# DELETE SUPPLIER
@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db)
):
    supplier = db.query(Supplier).filter(
        Supplier.supplier_id == supplier_id
    ).first()

    if supplier is None:
        raise HTTPException(
            status_code=404,
            detail="Supplier not found"
        )

    db.delete(supplier)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Supplier cannot be deleted because it is linked to other records"
        )

    return {
        "message": "Supplier deleted successfully",
        "supplier_id": supplier_id
    }