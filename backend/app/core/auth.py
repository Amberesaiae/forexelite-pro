"""
JWT Authentication Middleware
Verifies Supabase JWT tokens
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel
from app.core.config import get_settings


security = HTTPBearer()


class TokenPayload(BaseModel):
    """JWT token payload."""
    sub: str  # user_id
    email: Optional[str] = None
    exp: int


class AuthenticatedUser(BaseModel):
    """Authenticated user model."""
    id: str
    email: Optional[str] = None


def verify_supabase_jwt(token: str) -> TokenPayload:
    """Verify and decode Supabase JWT token."""
    settings = get_settings()
    
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return TokenPayload(**payload)
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from e


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> AuthenticatedUser:
    """FastAPI dependency to get current authenticated user."""
    token_payload = verify_supabase_jwt(credentials.credentials)
    
    return AuthenticatedUser(
        id=token_payload.sub,
        email=token_payload.email,
    )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
) -> Optional[AuthenticatedUser]:
    """FastAPI dependency for optional authentication (returns None if no valid token)."""
    if not credentials:
        return None
    
    try:
        token_payload = verify_supabase_jwt(credentials.credentials)
        return AuthenticatedUser(
            id=token_payload.sub,
            email=token_payload.email,
        )
    except HTTPException:
        return None
