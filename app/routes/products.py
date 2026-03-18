from typing import List
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models import models
from app.schemas import schemas
from fastapi import Depends, APIRouter, HTTPException
# Note: we import verify_admin from a separate utility to avoid circular imports
from app.utils.security import verify_admin

router = APIRouter(prefix="/products", tags=["products"])

@router.post("/", response_model=schemas.Product)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), admin: bool = Depends(verify_admin)):
    # Check if barcode exists
    existing_barcode = db.query(models.Product).filter(models.Product.barcode == product.barcode).first()
    if existing_barcode:
        raise HTTPException(status_code=400, detail=f"Product with barcode '{product.barcode}' already exists.")
    
    # Check if name exists
    existing_name = db.query(models.Product).filter(models.Product.name == product.name).first()
    if existing_name:
        raise HTTPException(status_code=400, detail=f"Product with name '{product.name}' already exists.")

    try:
        db_product = models.Product(**product.model_dump())
        db.add(db_product)
        db.commit()
        db.refresh(db_product)
        return db_product
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[schemas.Product])
def get_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()

@router.get("/{barcode}", response_model=schemas.Product)
def get_product_by_barcode(barcode: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.barcode == barcode).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, product_update: schemas.ProductCreate, db: Session = Depends(get_db), admin: bool = Depends(verify_admin)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if updated barcode conflicts with another product
    if product_update.barcode != db_product.barcode:
        existing_barcode = db.query(models.Product).filter(models.Product.barcode == product_update.barcode).first()
        if existing_barcode:
            raise HTTPException(status_code=400, detail=f"Product with barcode '{product_update.barcode}' already exists.")

    # Check if updated name conflicts with another product
    if product_update.name != db_product.name:
        existing_name = db.query(models.Product).filter(models.Product.name == product_update.name).first()
        if existing_name:
            raise HTTPException(status_code=400, detail=f"Product with name '{product_update.name}' already exists.")
    
    try:
        for key, value in product_update.model_dump().items():
            setattr(db_product, key, value)
        
        db.commit()
        db.refresh(db_product)
        return db_product
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), admin: bool = Depends(verify_admin)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(db_product)
    db.commit()
    return {"message": "Product deleted successfully"}
