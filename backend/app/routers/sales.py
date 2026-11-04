
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from decimal import Decimal

from app.database import get_db
from app.models.sales import Sale

router = APIRouter(
    prefix="/sales",
    tags=["Sales"]
)


class SaleCreate(BaseModel):
    customer_id: int | None = None
    total_amount: Decimal = Field(ge=0)


class SaleResponse(BaseModel):
    sale_id: int
    customer_id: int | None
    total_amount: Decimal
    sale_date: object | None = None

    class Config:
        from_attributes = True


@router.post("/", response_model=SaleResponse, status_code=201)
def create_sale(
    data: SaleCreate,
    db: Session = Depends(get_db)
):
    sale = Sale(
        customer_id=data.customer_id,
        total_amount=data.total_amount
    )

    db.add(sale)
    db.commit()
    db.refresh(sale)

    return sale


@router.get("/", response_model=list[SaleResponse])
def list_sales(db: Session = Depends(get_db)):
    return db.query(Sale).order_by(
        Sale.sale_date.desc()
    ).all()


@router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db)
):
    sale = db.query(Sale).filter(
        Sale.sale_id == sale_id
    ).first()

    if sale is None:
        raise HTTPException(
            status_code=404,
            detail="Sale not found"
        )

    return sale
