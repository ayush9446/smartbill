from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    price_per_unit: float = Field(..., ge=0)
    unit: str = "pcs"
    stock: float = Field(..., ge=0)
    category: Optional[str] = "General"
    barcode: str
    low_stock_threshold: float = Field(default=5.0, ge=0)

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int

    class Config:
        from_attributes = True

class InvoiceItemBase(BaseModel):
    product_id: int
    quantity: float # Weight or count

class InvoiceItemCreate(InvoiceItemBase):
    quantity: float = Field(..., ge=0.01)

class InvoiceItem(InvoiceItemBase):
    id: int
    unit_price: float
    subtotal: float
    product: Optional[Product] = None

    class Config:
        from_attributes = True

class InvoiceBase(BaseModel):
    customer_name: Optional[str] = "Walk-in Customer"
    discount: float = Field(default=0.0, ge=0)
    payment_method: str = "CASH"

class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate]

class Invoice(InvoiceBase):
    id: int
    invoice_number: str
    total_amount: float
    gst_amount: float
    cgst_amount: float
    sgst_amount: float
    payment_method: str
    created_at: datetime
    items: List[InvoiceItem]

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    password: str
    role: Optional[str] = "staff"

class User(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
