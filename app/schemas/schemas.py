from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    price_per_unit: float
    unit: str = "pcs"
    stock: float
    category: Optional[str] = "General"
    barcode: str
    low_stock_threshold: float = 5.0

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
    pass

class InvoiceItem(InvoiceItemBase):
    id: int
    unit_price: float
    subtotal: float
    product: Optional[Product] = None

    class Config:
        from_attributes = True

class InvoiceBase(BaseModel):
    customer_name: Optional[str] = "Walk-in Customer"
    discount: float = 0.0

class InvoiceCreate(InvoiceBase):
    items: List[InvoiceItemCreate]

class Invoice(InvoiceBase):
    id: int
    invoice_number: str
    total_amount: float
    gst_amount: float
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
