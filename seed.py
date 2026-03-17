from sqlalchemy.orm import Session
from app.database.connection import SessionLocal, engine, Base
from app.models import models

# Drop and recreate tables to ensure schema update
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    
    # Comprehensive variety for AKS SUPERMARKET
    products = [
        # Grains & Staples
        models.Product(name="Basmati Rice", price_per_unit=120.0, stock=50.0, unit="kg", category="Grains", barcode="1001"),
        models.Product(name="Sunflower Oil (1L)", price_per_unit=165.0, stock=20.0, unit="pcs", category="Oil", barcode="1002"),
        models.Product(name="Aashirvaad Atta (5kg)", price_per_unit=275.0, stock=30.0, unit="pcs", category="Flour", barcode="1003"),
        models.Product(name="Loose Sugar", price_per_unit=45.0, stock=100.0, unit="kg", category="Grocery", barcode="1004"),
        models.Product(name="Moong Dal", price_per_unit=140.0, stock=60.0, unit="kg", category="Pulses", barcode="1006"),
        models.Product(name="Toor Dal", price_per_unit=160.0, stock=45.0, unit="kg", category="Pulses", barcode="1007"),
        
        # Dairy & Breakfast
        models.Product(name="Amul Butter (100g)", price_per_unit=52.0, stock=40.0, unit="pcs", category="Dairy", barcode="1005"),
        models.Product(name="Amul Milk (500ml)", price_per_unit=28.0, stock=50.0, unit="pcs", category="Dairy", barcode="1008"),
        models.Product(name="Mother Dairy Curd", price_per_unit=35.0, stock=25.0, unit="pcs", category="Dairy", barcode="1009"),
        models.Product(name="Maggi Noodles (70g)", price_per_unit=14.0, stock=100.0, unit="pcs", category="Snacks", barcode="1010"),
        models.Product(name="Kellogg's Chocos", price_per_unit=185.0, stock=15.0, unit="pcs", category="Breakfast", barcode="1011"),

        # Fresh Produce
        models.Product(name="Potato", price_per_unit=30.0, stock=120.0, unit="kg", category="Vegetables", barcode="1012"),
        models.Product(name="Onion", price_per_unit=40.0, stock=150.0, unit="kg", category="Vegetables", barcode="1013"),
        models.Product(name="Tomato", price_per_unit=35.0, stock=80.0, unit="kg", category="Vegetables", barcode="1014"),
        models.Product(name="Apple (Royal Gala)", price_per_unit=180.0, stock=30.0, unit="kg", category="Fruits", barcode="1015"),
        models.Product(name="Banana (Robusta)", price_per_unit=60.0, stock=40.0, unit="kg", category="Fruits", barcode="1016"),

        # Beverages & Snacks
        models.Product(name="Coca Cola (500ml)", price_per_unit=40.0, stock=60.0, unit="pcs", category="Beverages", barcode="1017"),
        models.Product(name="Tata Tea (250g)", price_per_unit=125.0, stock=25.0, unit="pcs", category="Beverages", barcode="1018"),
        models.Product(name="Lay's Classic", price_per_unit=20.0, stock=80.0, unit="pcs", category="Snacks", barcode="1019"),
        models.Product(name="Brittania Good Day", price_per_unit=30.0, stock=50.0, unit="pcs", category="Snacks", barcode="1020"),

        # Household & Hygiene
        models.Product(name="Vim Bar", price_per_unit=15.0, stock=120.0, unit="pcs", category="Household", barcode="1021"),
        models.Product(name="Surf Excel (1kg)", price_per_unit=145.0, stock=35.0, unit="pcs", category="Household", barcode="1022"),
        models.Product(name="Lifebuoy Soap", price_per_unit=32.0, stock=90.0, unit="pcs", category="Personal Care", barcode="1023"),
        models.Product(name="Colgate (150g)", price_per_unit=95.0, stock=45.0, unit="pcs", category="Personal Care", barcode="1024"),
    ]
    
    # Check for existing barcodes to avoid duplicates
    for p in products:
        exists = db.query(models.Product).filter(models.Product.barcode == p.barcode).first()
        if not exists:
            db.add(p)
            
    db.commit()
    print(f"Inventory updated with {len(products)} premium products for AKS SUPERMARKET.")
    db.close()

if __name__ == "__main__":
    seed_data()
