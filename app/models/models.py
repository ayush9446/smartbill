from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="staff") # admin, staff

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    price_per_unit = Column(Float) # Price for 1 unit (1kg or 1pc)
    unit = Column(String, default="pcs") # kg, pcs, g
    stock = Column(Float) # Stock in units
    category = Column(String)
    barcode = Column(String, unique=True, index=True)
    low_stock_threshold = Column(Float, default=5.0)

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String, unique=True, index=True)
    customer_name = Column(String)
    total_amount = Column(Float)
    gst_amount = Column(Float) # Stores SGST/GST
    cgst_amount = Column(Float)
    sgst_amount = Column(Float)
    discount = Column(Float)
    created_at = Column(DateTime, default=datetime.now)

    items = relationship("InvoiceItem", back_populates="invoice")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Float) # Weight (kg) or Count (pcs)
    unit_price = Column(Float) # Price per unit at time of sale
    subtotal = Column(Float)

    invoice = relationship("Invoice", back_populates="items")
    product = relationship("Product")
