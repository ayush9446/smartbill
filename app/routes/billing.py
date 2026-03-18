from typing import List
import uuid
from sqlalchemy.orm import Session, joinedload
from app.database.connection import get_db
from app.models import models
from app.schemas import schemas
from fastapi import Depends, APIRouter, HTTPException
# Note: we import verify_admin from a separate utility to avoid circular imports
from app.utils.security import verify_admin
from app.config import settings


router = APIRouter(prefix="/billing", tags=["billing"])

@router.post("/invoice", response_model=schemas.Invoice)
def create_invoice(invoice_data: schemas.InvoiceCreate, db: Session = Depends(get_db)):
    try:
        total_amount = 0.0
        invoice_items = []
        
        # Generate unique invoice number
        invoice_number = f"INV-{uuid.uuid4().hex[:8].upper()}"
        
        for item in invoice_data.items:
            product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product with ID {item.product_id} not found")
            
            if product.stock < item.quantity:
                raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")
            
            # Calculate subtotals
            subtotal = product.price_per_unit * item.quantity
            total_amount += subtotal
            
            # Deduct stock
            product.stock -= item.quantity
            
            invoice_items.append(models.InvoiceItem(
                product_id=product.id,
                quantity=item.quantity,
                unit_price=product.price_per_unit,
                subtotal=subtotal
            ))
        
        # Calculate Taxes
        subtotal_total = total_amount
        gst_val = 0.0
        cgst_val = 0.0
        sgst_val = 0.0
        
        if settings.get("ENABLE_GST"):
            gst_val = (subtotal_total * settings.get("GST_PERCENT", 0) / 100)
        
        if settings.get("ENABLE_CGST"):
            cgst_val = (subtotal_total * settings.get("CGST_PERCENT", 0) / 100)

        if settings.get("ENABLE_SGST"):
            sgst_val = (subtotal_total * settings.get("SGST_PERCENT", 0) / 100)
        
        final_total = subtotal_total + gst_val + cgst_val + sgst_val - invoice_data.discount
        
        db_invoice = models.Invoice(
            invoice_number=invoice_number,
            customer_name=invoice_data.customer_name,
            total_amount=final_total,
            gst_amount=gst_val,
            cgst_amount=cgst_val,
            sgst_amount=sgst_val,
            discount=invoice_data.discount,
            items=invoice_items
        )
        
        db.add(db_invoice)
        db.commit()
        db.refresh(db_invoice)
        
        return db.query(models.Invoice).options(
            joinedload(models.Invoice.items).joinedload(models.InvoiceItem.product)
        ).filter(models.Invoice.id == db_invoice.id).first()

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/invoices", response_model=List[schemas.Invoice])
def get_invoices(db: Session = Depends(get_db)):
    return db.query(models.Invoice).options(joinedload(models.Invoice.items).joinedload(models.InvoiceItem.product)).all()
@router.post("/reset")
def reset_billing(db: Session = Depends(get_db), admin: bool = Depends(verify_admin)):
    try:
        # Delete invoice items first (though cascade delete should handle it if set)
        db.query(models.InvoiceItem).delete()
        db.query(models.Invoice).delete()
        db.commit()
        return {"message": "Billing data reset successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
