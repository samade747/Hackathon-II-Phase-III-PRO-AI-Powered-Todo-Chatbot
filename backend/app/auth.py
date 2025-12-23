import os
from dotenv import load_dotenv
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from typing import Optional

load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    # We will log a warning but allow the server to start if possible, 
    # though Supabase calls will fail.
    print("⚠️ WARNING: SUPABASE_URL or SUPABASE_ANON_KEY not found in environment.")

supabase: Client = create_client(SUPABASE_URL or "https://placeholder.supabase.co", SUPABASE_ANON_KEY or "placeholder")

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
