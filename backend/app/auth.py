import os
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from typing import Optional

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

security = HTTPBearer(auto_error=False)

async def verify_jwt(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    token = credentials.credentials
    try:
        # Verify the token with Supabase
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user.user.id}
    except Exception:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

def get_current_user(request: Request):
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
