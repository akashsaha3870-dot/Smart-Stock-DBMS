from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.database import get_db
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.inventory_batch import InventoryBatch
from app.schemas.inventory_batch import (
    InventoryBatchCreate,
    InventoryBatchResponse,
)

router = APIRouter(
    prefix="/batches",
    tags=["Inventory Batches"]
)


# --------------------------------------------------
# CREATE INVENTORY BATCH
# --------------------------------------------------

@router.post(
    "/",
    response_model=InventoryBatchResponse,
    status_code=status.HTTP_201_CREATED
)
def create_batch(
    data: InventoryBatchCreate,
    db: Session = Depends(get_db)
):
    # Check whether product exists
    product = db.query(Product).filter(
        Product.product_id == data.product_id
    ).first()

    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Validate dates
    if data.expiry_date <= data.received_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expiry date must be after received date"
        )

    try:
        # Create new batch
        batch = InventoryBatch(**data.model_dump())
        db.add(batch)

        # Find existing inventory record
        inventory = db.query(Inventory).filter(
            Inventory.product_id == data.product_id
        ).with_for_update().first()

        # Update stock quantity
        if inventory is None:
            inventory = Inventory(
                product_id=data.product_id,
                quantity=data.quantity,
                reserved_quantity=0
            )
            db.add(inventory)
        else:
            inventory.quantity += data.quantity

        # Save both changes together
        db.commit()
        db.refresh(batch)

        return batch

    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database error while creating inventory batch"
        )


# --------------------------------------------------
# GET ALL INVENTORY BATCHES
# --------------------------------------------------

@router.get(
    "/",
    response_model=list[InventoryBatchResponse]
)
def list_batches(
    db: Session = Depends(get_db)
):
    return db.query(InventoryBatch).order_by(
        InventoryBatch.expiry_date.asc()
    ).all()


# --------------------------------------------------
# GET SINGLE BATCH
# --------------------------------------------------

@router.get(
    "/{batch_id}",
    response_model=InventoryBatchResponse
)
def get_batch(
    batch_id: int,
    db: Session = Depends(get_db)
):
    batch = db.query(InventoryBatch).filter(
        InventoryBatch.batch_id == batch_id
    ).first()

    if batch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found"
        )

    return batch