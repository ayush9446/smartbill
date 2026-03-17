from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from app.database.connection import engine, Base, get_db
from app.models import models
from app.routes import products, billing
from app.config import settings, SettingsModel, save_settings, get_public_settings
from pydantic import BaseModel
import os

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Supermarket Billing System")
templates = Jinja2Templates(directory=os.path.join(os.path.dirname(__file__), "templates"))

# Include routers
app.include_router(products.router, prefix="/api")
app.include_router(billing.router, prefix="/api")

# Mount static files
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

app.mount("/static", StaticFiles(directory=static_dir), name="static")

# --- Password verification model ---
class PasswordVerify(BaseModel):
    password: str

class SettingsUpdateRequest(BaseModel):
    password: str
    SHOP_NAME: str
    SHOP_LOCATION: str
    SHOP_PHONE: str
    GST_NUMBER: str

@app.get("/api/settings")
async def get_settings():
    # Never expose the password to the frontend
    return get_public_settings(settings)

@app.post("/api/settings/verify-password")
async def verify_settings_password(data: PasswordVerify):
    if data.password == settings.get("SETTINGS_PASSWORD", "admin123"):
        return {"status": "success"}
    raise HTTPException(status_code=403, detail="Incorrect password")

@app.post("/api/settings")
async def update_settings(new_settings: SettingsUpdateRequest):
    try:
        # Verify password first
        if new_settings.password != settings.get("SETTINGS_PASSWORD", "admin123"):
            raise HTTPException(status_code=403, detail="Incorrect password. Settings not saved.")
        
        # Update only the shop fields (not the password)
        settings["SHOP_NAME"] = new_settings.SHOP_NAME
        settings["SHOP_LOCATION"] = new_settings.SHOP_LOCATION
        settings["SHOP_PHONE"] = new_settings.SHOP_PHONE
        settings["GST_NUMBER"] = new_settings.GST_NUMBER
        save_settings(settings)
        return {"status": "success", "settings": get_public_settings(settings)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def read_index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request, "settings": settings})

@app.get("/bill/{invoice_id}")
async def view_public_bill(request: Request, invoice_id: int, db: Session = Depends(get_db)):
    invoice = db.query(models.Invoice).options(
        joinedload(models.Invoice.items).joinedload(models.InvoiceItem.product)
    ).filter(models.Invoice.id == invoice_id).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    return templates.TemplateResponse("invoice_view.html", {"request": request, "invoice": invoice, "settings": settings})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

