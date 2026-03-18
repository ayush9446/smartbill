from fastapi import Depends, HTTPException
from fastapi.security import APIKeyHeader
from app.config import ADMIN_PASSWORD

# Admin security
admin_key_header = APIKeyHeader(name="X-Admin-Password", auto_error=False)

def verify_admin(x_admin_password: str = Depends(admin_key_header)):
    if x_admin_password != ADMIN_PASSWORD:
        raise HTTPException(status_code=403, detail="Admin access denied.")
    return True
