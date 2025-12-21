import os
from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Optional

BETTER_AUTH_SECRET = os.getenv("BETTER_AUTH_SECRET", "default-secret-change-me")
ALGORITHM = "HS256"

security = HTTPBearer(auto_error=False)

async def verify_jwt(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)):
    if credentials is None:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    token = credentials.credentials
    try:
        payload = jwt.decode(token, BETTER_AUTH_SECRET, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token: missing sub claim")
        return {"user_id": user_id}
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")

def get_current_user(request: Request):
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
