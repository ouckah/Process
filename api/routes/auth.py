"""
Authentication routes for OAuth.
"""
import os
import httpx
from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from database import get_db
from models import User
from auth import (
    create_access_token,
    get_user_by_email,
    get_user_by_discord_id,
    get_user_by_google_id,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    merge_user_accounts,
    is_admin_user,
    generate_unique_username
)
from schemas import UserResponse, UserUpdate, TokenResponse, DiscordBotTokenRequest
from rate_limiter import limiter
from email_service import send_welcome_email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserResponse)
@limiter.limit("60/minute")
def get_me(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Get current authenticated user info."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "discord_id": current_user.discord_id,
        "discord_avatar": current_user.discord_avatar,
        "google_id": current_user.google_id,
        "display_name": current_user.display_name,
        "is_anonymous": current_user.is_anonymous,
        "comments_enabled": current_user.comments_enabled,
        "email_notifications_enabled": current_user.email_notifications_enabled,
        "discord_privacy_mode": current_user.discord_privacy_mode,
    }


@router.patch("/me", response_model=UserResponse)
@limiter.limit("30/minute")
def update_me(
    request: Request,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current authenticated user info."""
    from auth import get_user_by_username
    
    # Update username if provided
    if user_data.username is not None:
        # Check if username is already taken (case-insensitive, excluding current user)
        existing_user = get_user_by_username(db, user_data.username)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=409,
                detail="Username is already taken"
            )
        current_user.username = user_data.username
    
    # Update display_name if provided
    if user_data.display_name is not None:
        display_name = user_data.display_name.strip() if user_data.display_name else None
        if display_name and len(display_name) > 100:
            raise HTTPException(
                status_code=400,
                detail="Display name must be at most 100 characters long."
            )
        current_user.display_name = display_name
    
    # Update is_anonymous if provided
    if user_data.is_anonymous is not None:
        current_user.is_anonymous = user_data.is_anonymous
        # If disabling anonymous mode, clear display_name (not needed when not anonymous)
        if not user_data.is_anonymous:
            current_user.display_name = None
    
    # Update comments_enabled if provided
    if user_data.comments_enabled is not None:
        current_user.comments_enabled = user_data.comments_enabled
    
    # Update email_notifications_enabled if provided
    if user_data.email_notifications_enabled is not None:
        current_user.email_notifications_enabled = user_data.email_notifications_enabled
    
    # Update discord_privacy_mode if provided
    if user_data.discord_privacy_mode is not None:
        if user_data.discord_privacy_mode not in ['private', 'public']:
            raise HTTPException(
                status_code=400,
                detail="discord_privacy_mode must be 'private' or 'public'"
            )
        current_user.discord_privacy_mode = user_data.discord_privacy_mode
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "discord_id": current_user.discord_id,
        "google_id": current_user.google_id,
        "display_name": current_user.display_name,
        "is_anonymous": current_user.is_anonymous,
        "comments_enabled": current_user.comments_enabled,
        "email_notifications_enabled": current_user.email_notifications_enabled,
        "discord_privacy_mode": current_user.discord_privacy_mode,
    }


@router.get("/is-admin")
def check_admin(current_user: User = Depends(get_current_user)):
    """Check if current user is an admin."""
    return {"is_admin": is_admin_user(current_user)}


@router.get("/discord/callback")
@limiter.limit("10/minute")
def discord_oauth_callback(
    request: Request,
    code: str,
    state: str,
    db: Session = Depends(get_db)
):
    """
    Discord OAuth callback - handles the OAuth redirect from Discord.
    ONLY allows linking Discord account to existing user account.
    Sign-ups via Discord are not allowed - users must sign up with Google.
    """
    DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
    DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    API_URL = os.getenv("API_URL", "http://localhost:8000")
    
    if not DISCORD_CLIENT_ID or not DISCORD_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Discord OAuth not configured"
        )
    
    # Exchange code for access token
    # Backend callback URL (Discord redirects here)
    backend_redirect_uri = f"{API_URL}/auth/discord/callback"
    # Frontend redirect URL (where we send user after processing)
    frontend_redirect_uri = f"{FRONTEND_URL}/auth/discord/callback"
    token_url = "https://discord.com/api/oauth2/token"
    
    try:
        with httpx.Client() as client:
            token_response = client.post(
                token_url,
                data={
                    "client_id": DISCORD_CLIENT_ID,
                    "client_secret": DISCORD_CLIENT_SECRET,
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": backend_redirect_uri,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            token_data = token_response.json()
            
            if "access_token" not in token_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get Discord access token"
                )
            
            # Get user info from Discord
            user_response = client.get(
                "https://discord.com/api/users/@me",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            discord_user = user_response.json()
            
            discord_id = str(discord_user.get("id"))
            raw_username = discord_user.get("username", "")
            email = discord_user.get("email", "")
            discord_avatar = discord_user.get("avatar")  # Discord avatar hash
            
            # Generate unique, sanitized username from Discord username
            username = generate_unique_username(db, raw_username)
            
            # Parse state to get user_id - REQUIRED for Discord OAuth (only for linking)
            import json
            state_data = json.loads(state) if state else {}
            user_id = state_data.get("userId")
            
            # Discord OAuth is ONLY for linking existing accounts - reject sign-ups
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Discord authentication is only available for linking to existing accounts. Please sign up with Google first, then connect Discord from your profile page."
                )
            
            # Handle account linking (user_id is required)
            if user_id:
                # Scenario: Explicit user_id in state (linking from profile page)
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    # Store original email to ensure we don't accidentally change it
                    original_email = user.email
                    
                    # Check if discord_id is already linked to another account
                    existing_discord_user = get_user_by_discord_id(db, discord_id)
                    if existing_discord_user and existing_discord_user.id != user.id:
                        # Discord ID is already linked to another account - this is not allowed
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="This Discord account is already linked to another account. Please disconnect it from the other account first or use a different Discord account."
                        )
                    
                    user.discord_id = discord_id
                    if discord_avatar:
                        user.discord_avatar = discord_avatar
                    # IMPORTANT: Only update email if user doesn't have one (never change existing email)
                    # This preserves the original email the user registered with, preventing
                    # authentication issues if Discord email differs from web account email
                    if email and not user.email:
                        user.email = email
                    # Explicitly ensure email hasn't changed (safety check)
                    if original_email and user.email != original_email:
                        user.email = original_email
                    if not user.username:
                        user.username = username
                    db.commit()
                    db.refresh(user)
            else:
                # User not found - this shouldn't happen if user_id is valid, but handle it
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="User account not found. Please sign up with Google first, then connect Discord from your profile page."
                )
            
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": str(user.id)}, expires_delta=access_token_expires
            )
            
            # Redirect to frontend with token
            from fastapi.responses import RedirectResponse
            return RedirectResponse(
                url=f"{frontend_redirect_uri}?token={access_token}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Discord OAuth error: {str(e)}"
        )


@router.post("/discord/link")
def link_discord_account(
    code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Link Discord account to existing authenticated user.
    """
    DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
    DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    if not DISCORD_CLIENT_ID or not DISCORD_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Discord OAuth not configured"
        )
    
    # Exchange code for access token
    redirect_uri = f"{FRONTEND_URL}/auth/discord/callback"
    token_url = "https://discord.com/api/oauth2/token"
    
    try:
        with httpx.Client() as client:
            token_response = client.post(
                token_url,
                data={
                    "client_id": DISCORD_CLIENT_ID,
                    "client_secret": DISCORD_CLIENT_SECRET,
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": redirect_uri,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            token_data = token_response.json()
            
            if "access_token" not in token_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get Discord access token"
                )
            
            # Get user info from Discord
            user_response = client.get(
                "https://discord.com/api/users/@me",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            discord_user = user_response.json()
            
            discord_id = str(discord_user.get("id"))
            email = discord_user.get("email", "")
            discord_avatar = discord_user.get("avatar")  # Discord avatar hash
            
            # Check if Discord ID is already linked to another account
            existing_discord_user = get_user_by_discord_id(db, discord_id)
            
            if existing_discord_user and existing_discord_user.id != current_user.id:
                # Account with this Discord ID exists - merge it into current_user
                # This handles both ghost accounts and accounts with different emails
                # The merge preserves current_user's email and transfers all data
                merge_user_accounts(db, existing_discord_user, current_user)
                # Refresh current_user after merge to ensure we have the latest state
                db.refresh(current_user)
            
            # Check if Discord email is already used by a different account (after merge)
            # This prevents conflicts if the Discord email belongs to yet another account
            if email:
                existing_email_user = get_user_by_email(db, email)
                if existing_email_user and existing_email_user.id != current_user.id:
                    # Discord email belongs to another account - this is a conflict
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Discord email ({email}) is already associated with another account. Please use a different Discord account or contact support."
                    )
            
            # Link Discord account to current user
            # IMPORTANT: Preserve the original email - NEVER change it
            # Store original email to ensure we don't accidentally change it
            original_email = current_user.email
            
            current_user.discord_id = discord_id
            if discord_avatar:
                current_user.discord_avatar = discord_avatar
            # IMPORTANT: Only update email if user doesn't have one (never change existing email)
            # This preserves the original email the user registered with, preventing
            # authentication issues if Discord email differs from web account email
            if email and not current_user.email:
                current_user.email = email
            # Explicitly ensure email hasn't changed (safety check)
            if original_email and current_user.email != original_email:
                current_user.email = original_email
            
            db.commit()
            db.refresh(current_user)
            
            return {"message": "Discord account linked successfully", "discord_id": discord_id}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to link Discord account: {str(e)}"
        )


@router.delete("/discord/disconnect")
def disconnect_discord_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Disconnect Discord account from the current user.
    """
    if not current_user.discord_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Discord account is not connected"
        )
    
    # Remove Discord ID and avatar from user
    current_user.discord_id = None
    current_user.discord_avatar = None
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Discord account disconnected successfully"}


@router.get("/google/callback")
@limiter.limit("10/minute")
def google_oauth_callback(
    request: Request,
    code: str = Query(..., description="OAuth authorization code from Google"),
    state: Optional[str] = Query(None, description="OAuth state parameter"),
    db: Session = Depends(get_db)
):
    """
    Google OAuth callback - handles the OAuth redirect from Google.
    Links Google account to existing user or creates new account.
    """
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    API_URL = os.getenv("API_URL", "http://localhost:8000")
    
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google OAuth not configured"
        )
    
    # Exchange code for access token
    backend_redirect_uri = f"{API_URL}/auth/google/callback"
    frontend_redirect_uri = f"{FRONTEND_URL}/auth/google/callback"
    token_url = "https://oauth2.googleapis.com/token"
    
    # Debug logging
    print(f"Google OAuth callback - API_URL: {API_URL}")
    print(f"Google OAuth callback - Backend redirect URI: {backend_redirect_uri}")
    print(f"Google OAuth callback - Has GOOGLE_CLIENT_ID: {bool(GOOGLE_CLIENT_ID)}")
    print(f"Google OAuth callback - Has GOOGLE_CLIENT_SECRET: {bool(GOOGLE_CLIENT_SECRET)}")
    
    try:
        print("Starting Google OAuth token exchange...")
        with httpx.Client() as client:
            print(f"Making token request to: {token_url}")
            token_response = client.post(
                token_url,
                data={
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": backend_redirect_uri,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            print(f"Token response status: {token_response.status_code}")
            
            # Check for errors in response
            if token_response.status_code != 200:
                error_detail = token_response.text
                try:
                    error_json = token_response.json()
                    error_detail = error_json.get("error_description", error_json.get("error", error_detail))
                except:
                    pass
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Google OAuth token exchange failed: {error_detail}. Redirect URI used: {backend_redirect_uri}"
                )
            
            token_data = token_response.json()
            
            if "access_token" not in token_data:
                error_msg = token_data.get("error_description", token_data.get("error", "Unknown error"))
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to get Google access token: {error_msg}. Redirect URI used: {backend_redirect_uri}"
                )
            
            # Get user info from Google
            print("Fetching user info from Google...")
            user_response = client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            print(f"User info response status: {user_response.status_code}")
            
            # Check for errors in user info response
            if user_response.status_code != 200:
                error_detail = user_response.text
                try:
                    error_json = user_response.json()
                    error_detail = error_json.get("error_description", error_json.get("error", error_detail))
                except:
                    pass
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to get Google user info: {error_detail}"
                )
            
            print("Parsing user info JSON...")
            try:
                google_user = user_response.json()
                print(f"Google user keys: {list(google_user.keys())}")
            except Exception as e:
                print(f"ERROR parsing user info JSON: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to parse Google user info response: {str(e)}"
                )
            
            if not google_user.get("id"):
                print("ERROR: Google user info missing 'id' field")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Google user info missing required fields"
                )
            
            google_id = str(google_user.get("id"))
            email = google_user.get("email", "")
            raw_username = google_user.get("name", email.split("@")[0] if email else "user")
            print(f"Google ID: {google_id}, Email: {email}, Raw username: {raw_username}")
            
            # Generate unique, sanitized username from Google name
            print("Generating unique username...")
            try:
                username = generate_unique_username(db, raw_username)
                print(f"Generated username: {username}")
            except Exception as e:
                print(f"ERROR generating username: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to generate username: {str(e)}"
                )
            
            # Parse state to get user_id if linking to existing account
            import json
            state_data = {}
            if state:
                try:
                    state_data = json.loads(state)
                except (json.JSONDecodeError, ValueError, TypeError):
                    # If state is not valid JSON, treat as empty
                    state_data = {}
            user_id = state_data.get("userId")
            
            # Check for existing accounts
            print("Checking for existing accounts...")
            google_user_obj = get_user_by_google_id(db, google_id)
            email_user = None
            if email:
                email_user = get_user_by_email(db, email)
            print(f"Found google_user_obj: {google_user_obj is not None}, email_user: {email_user is not None}")
            
            # Handle account linking/creation (similar to Discord flow)
            if user_id:
                # Explicit linking from profile page
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    original_email = user.email
                    
                    # Check if Google ID is already linked to another account
                    existing_google_user = get_user_by_google_id(db, google_id)
                    if existing_google_user and existing_google_user.id != user.id:
                        merge_user_accounts(db, existing_google_user, user)
                        db.refresh(user)
                    
                    # Check if Google email is already used by a different account
                    if email:
                        existing_email_user = get_user_by_email(db, email)
                        if existing_email_user and existing_email_user.id != user.id:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Google email ({email}) is already associated with another account."
                            )
                    
                    user.google_id = google_id
                    if email and not user.email:
                        user.email = email
                    if original_email and user.email != original_email:
                        user.email = original_email
                    if not user.username:
                        user.username = username
                    db.commit()
                    db.refresh(user)
                else:
                    # User not found, create new
                    if not email:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Google account email not available"
                        )
                user = User(
                    google_id=google_id,
                    email=email,
                    username=username,
                )
                db.add(user)
                try:
                    db.commit()
                except Exception as e:
                    db.rollback()
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to create user account: {str(e)}"
                    )
                db.refresh(user)
                # Send welcome email (non-blocking)
                try:
                    send_welcome_email(user)
                except Exception as e:
                    # Don't block signup if email fails
                    print(f"Warning: Failed to send welcome email: {str(e)}")
                    pass
            elif google_user_obj and email_user:
                # Both exist - merge
                if google_user_obj.id != email_user.id:
                    merge_user_accounts(db, google_user_obj, email_user)
                    email_user.google_id = google_id
                    if not email_user.username:
                        email_user.username = username
                    db.commit()
                    db.refresh(email_user)
                    user = email_user
                else:
                    user = google_user_obj
            elif google_user_obj and not email_user:
                # Google account exists, no email account
                user = google_user_obj
                if email and not user.email:
                    user.email = email
                if not user.username:
                    user.username = username
                db.commit()
                db.refresh(user)
            elif not google_user_obj and email_user:
                # Email account exists, no Google account
                email_user.google_id = google_id
                if not email_user.username:
                    email_user.username = username
                db.commit()
                db.refresh(email_user)
                user = email_user
            else:
                # Neither exists - create new
                if not email:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Google account email not available"
                    )
                user = User(
                    google_id=google_id,
                    email=email,
                    username=username,
                )
                db.add(user)
                try:
                    db.commit()
                except Exception as e:
                    db.rollback()
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Failed to create user account: {str(e)}"
                    )
                db.refresh(user)
                # Send welcome email (non-blocking)
                try:
                    send_welcome_email(user)
                except Exception as e:
                    # Don't block signup if email fails
                    print(f"Warning: Failed to send welcome email: {str(e)}")
                    pass
            
            access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            access_token = create_access_token(
                data={"sub": str(user.id)}, expires_delta=access_token_expires
            )
            
            # Redirect to frontend with token
            from fastapi.responses import RedirectResponse
            return RedirectResponse(
                url=f"{frontend_redirect_uri}?token={access_token}"
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Log the full error for debugging
        import traceback
        import sys
        error_trace = traceback.format_exc()
        error_type = type(e).__name__
        error_message = str(e)
        
        # Print to stderr so it shows up in logs
        print(f"\n{'='*60}", file=sys.stderr)
        print(f"Google OAuth callback ERROR:", file=sys.stderr)
        print(f"Type: {error_type}", file=sys.stderr)
        print(f"Message: {error_message}", file=sys.stderr)
        print(f"Traceback:", file=sys.stderr)
        print(error_trace, file=sys.stderr)
        print(f"{'='*60}\n", file=sys.stderr)
        
        # Also print to stdout
        print(f"Google OAuth callback error: {error_type}: {error_message}")
        print(f"Full traceback:\n{error_trace}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Google OAuth error: {error_type}: {error_message}"
        )


@router.post("/discord/bot-token", response_model=TokenResponse)
def get_discord_bot_token(
    request: DiscordBotTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Get authentication token for Discord bot user.
    Creates ghost account if user doesn't exist.
    Used by Discord bot to authenticate API requests.
    """
    discord_id = request.discord_id
    raw_username = request.username
    # Generate unique, sanitized username
    username = generate_unique_username(db, raw_username)
    
    # Get or create user by discord_id
    user = get_user_by_discord_id(db, discord_id)
    is_new_user = False
    
    if not user:
        # Create ghost account
        user = User(
            discord_id=discord_id,
            username=username,
            email=None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new_user = True
    else:
        # Update username if it's different (bot can update usernames as Discord changes)
        if user.username != username:
            user.username = username
            db.commit()
            db.refresh(user)
    
    # Create token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "is_new_user": is_new_user,
        "user_created_at": user.created_at.isoformat() if user.created_at else None
    }

