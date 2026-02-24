"""Authentication routes."""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from typing import Optional

router = APIRouter(tags=["auth"])


class AuthResponse(BaseModel):
    """Authentication response."""
    user_id: str
    email: str
    session_token: str


class SignInRequest(BaseModel):
    """Sign in request."""
    email: EmailStr
    password: str


class SignUpRequest(BaseModel):
    """Sign up request."""
    email: EmailStr
    password: str
    display_name: Optional[str] = None


class ForgotPasswordRequest(BaseModel):
    """Forgot password request."""
    email: EmailStr


@router.post("/auth/signin")
async def sign_in(credentials: SignInRequest):
    """
    Sign in with email and password.
    
    Returns:
        User ID and session token
    """
    from supabase import create_client
    from app.core.config import settings
    
    try:
        client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
        
        result = client.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        return {
            "user_id": result.user.id,
            "email": result.user.email,
            "session_token": result.session.access_token
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )


@router.post("/auth/signup")
async def sign_up(data: SignUpRequest):
    """
    Sign up with email and password.
    
    Returns:
        User ID and session token
    """
    from supabase import create_client
    from app.core.config import settings
    
    try:
        client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SUPABASE_KEY
        )
        
        result = client.auth.sign_up({
            "email": data.email,
            "password": data.password,
            "options": {
                "data": {
                    "display_name": data.display_name
                }
            }
        })
        
        return {
            "user_id": result.user.id,
            "email": result.user.email,
            "session_token": result.session.access_token if result.session else None
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """
    Request password reset email.
    
    Returns:
        Confirmation message
    """
    from supabase import create_client
    from app.core.config import settings
    
    try:
        client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SUPABASE_KEY
        )
        
        client.auth.reset_password_email(request.email)
        
        return {"message": "Password reset email sent"}
        
    except Exception as e:
        # Don't reveal if email exists
        return {"message": "Password reset email sent"}


@router.post("/auth/signout")
async def sign_out():
    """
    Sign out (invalidate session).
    
    Returns:
        Confirmation message
    """
    # Client-side should clear the token
    return {"message": "Signed out successfully"}


@router.get("/auth/session")
async def get_session(token: str):
    """
    Get current session info.
    
    Returns:
        User info if session is valid
    """
    from supabase import create_client
    from app.core.config import settings
    
    try:
        client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SUPABASE_KEY
        )
        
        result = client.auth.get_session()
        
        if result and result.session:
            return {
                "user_id": result.user.id,
                "email": result.user.email,
                "expires_at": result.session.expires_at
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session"
        )