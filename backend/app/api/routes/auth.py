"""
Authentication Routes
Login, Signup, Token Refresh
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import create_client
from app.core.config import get_settings
from app.core.auth import get_current_user, AuthenticatedUser


router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: dict


@router.post("/login")
async def login(request: LoginRequest) -> AuthResponse:
    """Authenticate user with email and password."""
    settings = get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    
    try:
        response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password,
        })
        
        if not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="invalid_credentials",
            )
        
        return AuthResponse(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            user={"id": response.user.id, "email": response.user.email},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid_credentials",
        ) from e


@router.post("/signup")
async def signup(request: SignupRequest) -> AuthResponse:
    """Create new user account."""
    settings = get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    
    try:
        response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
        })
        
        if not response.user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed",
            )
        
        return AuthResponse(
            access_token=response.session.access_token if response.session else "",
            refresh_token=response.session.refresh_token if response.session else "",
            user={"id": response.user.id, "email": response.user.email},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed",
        ) from e


@router.post("/refresh")
async def refresh(request: RefreshRequest) -> AuthResponse:
    """Refresh access token using refresh token."""
    settings = get_settings()
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    
    try:
        response = supabase.auth.refresh_session(request.refresh_token)
        
        if not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="invalid_credentials",
            )
        
        return AuthResponse(
            access_token=response.session.access_token,
            refresh_token=response.session.refresh_token,
            user={"id": response.user.id, "email": response.user.email},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid_credentials",
        ) from e


@router.get("/me")
async def get_me(current_user: AuthenticatedUser = Depends(get_current_user)) -> dict:
    """Get current authenticated user info."""
    return {"id": current_user.id, "email": current_user.email}
