from fastapi.middleware.cors import CORSMiddleware
from app.routers.product import router as product_router
from app.routers.inventory import router as inventory_router
from app.routers.inventory_batch import router as batch_router
from app.routers.expiry_alert import router as expiry_alert_router
from app.routers.purchase import router as purchase_router
from app.routers.purchase_item import router as purchase_item_router
from app.routers.stock_alerts import router as stock_alerts_router
from app.routers.supplier import router as supplier_router
from app.routers.sales import router as sales_router
from app.routers.sale_items import router as sale_items_router
from app.routers.reorder_recommendation import (
    router as reorder_recommendation_router
)
from app.routers.demand_forecasting import (
    router as demand_forecasting_router
)
from app.routers.smart_replenishment import (
    router as smart_replenishment_router
)
from fastapi import FastAPI
from sqlalchemy import text


from app.database import engine, Base
import app.models



app = FastAPI(
    title="Smart Stock API",
    description="Intelligent Inventory Management System",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(product_router)
app.include_router(inventory_router)
app.include_router(batch_router)
app.include_router(expiry_alert_router)
app.include_router(purchase_router)
app.include_router(purchase_item_router)
app.include_router(stock_alerts_router)
app.include_router(reorder_recommendation_router)
app.include_router(demand_forecasting_router)
app.include_router(smart_replenishment_router)
app.include_router(supplier_router)
app.include_router(sales_router)
app.include_router(sale_items_router)


@app.get("/")
def root():
    return {
        "message": "Smart Stock API is running",
        "status": "success"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.get("/db-test")
def database_test():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            value = result.scalar()

        return {
            "status": "success",
            "database": "connected",
            "test_result": value
        }

    except Exception as e:
        return {
            "status": "error",
            "database": "connection failed",
            "message": str(e)
        }

    
@app.post("/setup-database")
def setup_database():
    try:
        Base.metadata.create_all(bind=engine)
        return {
            "status": "success",
            "message": "Smart Stock tables created successfully",
            "tables": list(Base.metadata.tables.keys())
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
