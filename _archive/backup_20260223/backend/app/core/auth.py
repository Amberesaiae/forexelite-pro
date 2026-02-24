"""Supabase JWT authentication middleware and utilities."""

import logging
from typing import Optional
from datetime import datetime, timezone

import httpx
from fastapi import HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

from app.core.config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer()


class TokenPayload(BaseModel):
    """Decoded JWT token payload."""
    sub: str  # User ID
    email: Optional[str] = None
    exp: Optional[int] = None
    iat: Optional[int] = None
    aud: Optional[str] = None


class AuthenticatedUser(BaseModel):
    """Authenticated user information extracted from JWT."""
    id: str
    email: Optional[str] = None


async def verify_supabase_jwt(token: str) -> TokenPayload:
    """
    Verify a Supabase JWT token and return the decoded payload.
    
    Args:
        token: The JWT token to verify
        
    Returns:
        Decoded token payload
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        # Supabase JWT verification endpoint
        jwks_url = f"{settings.SUPABASE_URL}/auth/v1/jwks"
        
        async with httpx.AsyncClient() as client:
            # Get JWKS from Supabase
            response = await client.get(jwks_url)
            response.raise_for_status()
            jwks = response.json()
            
        # For development, also allow direct JWT secret verification
        # In production, use proper JWT verification with the JWKS
        import jwt
        
        # Decode token using the JWT secret
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": True}
        )
        
        return TokenPayload(**payload)
        
    except jwt.ExpiredSignatureError:
        logger.warning("JWT token has expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except httpx.HTTPError as e:
        logger.error(f"Failed to verify JWT with Supabase: {e}")
        # Fall back to local verification
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed"
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> AuthenticatedUser:
    """
    FastAPI dependency to get the current authenticated user.
    
    Args:
        credentials: HTTP Bearer token credentials
        
    Returns:
        AuthenticatedUser with user ID and email
    """
    token = credentials.credentials
    payload = await verify_supabase_jwt(token)
    
    return AuthenticatedUser(
        id=payload.sub,
        email=payload.email
    )


async def get_optional_user(
    request: Request
) -> Optional[AuthenticatedUser]:
    """
    Optional user dependency - returns None if no valid token.
    
    Args:
        request: The incoming request
        
    Returns:
        AuthenticatedUser or None
    """
    auth_header = request.headers.get("Authorization")
    
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header[7:]  # Remove "Bearer " prefix
    
    try:
        payload = await verify_supabase_jwt(token)
        return AuthenticatedUser(
            id=payload.sub,
            email=payload.email
        )
    except HTTPException:
        return None


def create_error_response(status_code: int, detail: str):
    """Create a JSON error response."""
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=status_code,
        content={"detail": detail}
    )