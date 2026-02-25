"""
JWT Authentication Middleware
Verifies Supabase JWT tokens
"""
from typing import Optional
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, jwk
from jose.utils import base64url_decode
from pydantic import BaseModel
from app.core.config import get_settings
import json


security = HTTPBearer()

# Cache for JWKS keys
_jwks_cache = None


class TokenPayload(BaseModel):
    """JWT token payload."""
    sub: str  # user_id
    email: Optional[str] = None
    exp: int


class AuthenticatedUser(BaseModel):
    """Authenticated user model."""
    id: str
    email: Optional[str] = None


async def get_jwks():
    """Fetch JWKS from Supabase."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache
    
    settings = get_settings()
    jwks_url = f"{settings.SUPABASE_URL}/auth/v1/jwks"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(jwks_url)
        response.raise_for_status()
        _jwks_cache = response.json()
        return _jwks_cache


def verify_supabase_jwt(token: str) -> TokenPayload:
    """Verify and decode Supabase JWT token."""
    settings = get_settings()
    
    try:
        # First try to decode without verification to get the header
        unverified_header = jwt.get_unverified_header(token)
        algorithm = unverified_header.get("alg", "HS256")
        
        # If it's ES256, we need to fetch the public key from JWKS
        if algorithm == "ES256":
            import asyncio
            jwks = asyncio.run(get_jwks())
            kid = unverified_header.get("kid")
            
            # Find the matching key
            key_data = None
            for key in jwks.get("keys", []):
                if key.get("kid") == kid:
                    key_data = key
                    break
            
            if not key_data:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Unable to find matching key",
                )
            
            # Verify with the public key
            payload = jwt.decode(
                token,
                key_data,
                algorithms=["ES256"],
                audience="authenticated",
            )
        else:
            # Fall back to HS256 for legacy tokens
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
