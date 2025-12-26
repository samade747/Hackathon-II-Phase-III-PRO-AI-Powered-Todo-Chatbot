import os
from dotenv import load_dotenv
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from typing import Optional

# explicitly load .env from backend root
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(os.path.dirname(current_dir)) # app -> backend
env_path = os.path.join(backend_dir, ".env")
# fallback to local .env if searching up fails or just rely on standard load_dotenv behavior with override
load_dotenv(env_path) if os.path.exists(env_path) else load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    # Try alternate names just in case
    SUPABASE_URL = SUPABASE_URL or os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY = SUPABASE_ANON_KEY or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print(f"CRITICAL: Supabase Environment Variables are MISSING in the Backend. Searched at {env_path}")
else:
    print(f"Backend initialized for Supabase: {SUPABASE_URL[:20]}...")
    srv_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if srv_key:
        print(f"Service Role Key loaded (Starts with: {srv_key[:10]})...")
    else:
        print("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is MISSING!")

supabase: Client = create_client(
    SUPABASE_URL or "https://missing-backend-config.supabase.co", 
    SUPABASE_ANON_KEY or "missing-key"
)

# Initialize Admin Client for Backend Operations (Bypasses RLS)
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase_admin: Client = create_client(
    SUPABASE_URL or "https://missing-backend-config.supabase.co", 
    SUPABASE_SERVICE_ROLE_KEY or "missing-service-key"
)

security = HTTPBearer(auto_error=False)

async def verify_jwt(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)):
    if credentials is None:
        print("[AUTH] Error: Authorization header missing")
        raise HTTPException(status_code=401, detail="Authorization header missing")
    token = credentials.credentials
    try:
        # Verify the token with Supabase
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            print("[AUTH] Error: Supabase rejected the token")
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user.user.id}
    except Exception as e:
        print(f"[AUTH] Error: Verification failed: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

def get_current_user(request: Request):
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
