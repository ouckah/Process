"""
Authentication routes for login, registration, and OAuth.
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from database import get_db
from models import User
from auth import (
    create_access_token,
    get_user_by_email,
    get_user_by_discord_id,
    get_user_by_google_id,
    get_current_user,
    get_password_hash,
    verify_password,
    authenticate_user,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    merge_user_accounts,
    is_admin_user
)
from schemas import UserResponse, UserUpdate, TokenResponse, UserRegister, DiscordBotTokenRequest

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """
    Register a new user with email/password.
    DEPRECATED: New registrations are only available via OAuth (Google/Discord).
    This endpoint is kept for backward compatibility but returns an error.
    """
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Email/password registration is no longer available. Please use Google or Discord OAuth to sign up."
    )


@router.post("/login", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login with username or email and password.
    Returns JWT token on successful authentication.
    """
    # OAuth2PasswordRequestForm uses 'username' field, but we accept both username and email
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    from datetime import datetime
    user.last_login = datetime.utcnow()
    db.commit()
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info."""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "discord_id": current_user.discord_id,
        "google_id": current_user.google_id,
        "display_name": current_user.display_name,
        "is_anonymous": current_user.is_anonymous,
        "comments_enabled": current_user.comments_enabled,
        "discord_privacy_mode": current_user.discord_privacy_mode,
    }


@router.patch("/me", response_model=UserResponse)
def update_me(
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
        "discord_privacy_mode": current_user.discord_privacy_mode,
    }


@router.get("/is-admin")
def check_admin(current_user: User = Depends(get_current_user)):
    """Check if current user is an admin."""
    return {"is_admin": is_admin_user(current_user)}


@router.get("/discord/callback")
def discord_oauth_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db)
):
    """
    Discord OAuth callback - handles the OAuth redirect from Discord.
    Links Discord account to existing user or creates new account.
    """
    import os
    import httpx
    from dotenv import load_dotenv
    load_dotenv()
    
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
            username = discord_user.get("username", "")
            email = discord_user.get("email", "")
            
            # Parse state to get user_id if linking to existing account
            import json
            state_data = json.loads(state) if state else {}
            user_id = state_data.get("userId")
            
            # Check for existing accounts
            ghost_user = get_user_by_discord_id(db, discord_id)  # Ghost account (discord_id only, no email)
            web_user = None
            if email:
                web_user = get_user_by_email(db, email)  # Web account (has email)
            
            # Handle all merging scenarios
            # IMPORTANT: If user_id is provided in state, prioritize that over email/discord lookups
            if user_id:
                # Scenario: Explicit user_id in state (linking from profile page)
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    # Store original email to ensure we don't accidentally change it
                    original_email = user.email
                    
                    # Check if discord_id is already linked to another account
                    existing_discord_user = get_user_by_discord_id(db, discord_id)
                    if existing_discord_user and existing_discord_user.id != user.id:
                        # Merge ghost account into target user
                        merge_user_accounts(db, existing_discord_user, user)
                        # Refresh user after merge to ensure we have the latest state
                        db.refresh(user)
                    
                    # Check if Discord email is already used by a different account (after merge)
                    if email:
                        existing_email_user = get_user_by_email(db, email)
                        if existing_email_user and existing_email_user.id != user.id:
                            # Discord email belongs to another account - this is a conflict
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Discord email ({email}) is already associated with another account. Please use a different Discord account or contact support."
                            )
                    
                    user.discord_id = discord_id
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
                    # User not found, create new
                    if not email:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Discord account email not available"
                        )
                    user = User(
                        discord_id=discord_id,
                        email=email,
                        username=username,
                    )
                    db.add(user)
                    db.commit()
                    db.refresh(user)
            elif ghost_user and web_user:
                # Scenario: Ghost account exists AND web account exists (same email)
                # Merge: Transfer processes from ghost to web, delete ghost
                if ghost_user.id != web_user.id:
                    merge_user_accounts(db, ghost_user, web_user)
                    # Update web account with discord_id
                    web_user.discord_id = discord_id
                    if not web_user.username:
                        web_user.username = username
                    db.commit()
                    db.refresh(web_user)
                    user = web_user
                else:
                    # Same user, just update
                    user = ghost_user
                    if not user.email:
                        user.email = email
                    db.commit()
                    db.refresh(user)
            elif ghost_user and not web_user:
                # Scenario: Ghost account exists, no web account
                # Convert ghost to full account by adding email
                if email:
                    ghost_user.email = email
                    if not ghost_user.username:
                        ghost_user.username = username
                    db.commit()
                    db.refresh(ghost_user)
                    user = ghost_user
                else:
                    # No email from Discord, can't convert - just update username
                    if not ghost_user.username:
                        ghost_user.username = username
                    db.commit()
                    db.refresh(ghost_user)
                    user = ghost_user
            elif not ghost_user and web_user:
                # Scenario: No ghost account, web account exists
                # Link discord_id to web account
                web_user.discord_id = discord_id
                if not web_user.username:
                    web_user.username = username
                db.commit()
                db.refresh(web_user)
                user = web_user
            else:
                # Scenario: Neither exists - create new user
                if not email:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Discord account email not available"
                    )
                user = User(
                    discord_id=discord_id,
                    email=email,
                    username=username,
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            
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
    import os
    import httpx
    from dotenv import load_dotenv
    load_dotenv()
    
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
    
    # Remove Discord ID from user
    current_user.discord_id = None
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Discord account disconnected successfully"}


@router.get("/google/callback")
def google_oauth_callback(
    code: str,
    state: str,
    db: Session = Depends(get_db)
):
    """
    Google OAuth callback - handles the OAuth redirect from Google.
    Links Google account to existing user or creates new account.
    """
    import os
    import httpx
    from dotenv import load_dotenv
    load_dotenv()
    
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
    
    try:
        with httpx.Client() as client:
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
            token_data = token_response.json()
            
            if "access_token" not in token_data:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to get Google access token"
                )
            
            # Get user info from Google
            user_response = client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {token_data['access_token']}"},
            )
            google_user = user_response.json()
            
            google_id = str(google_user.get("id"))
            email = google_user.get("email", "")
            username = google_user.get("name", email.split("@")[0] if email else "user")
            
            # Parse state to get user_id if linking to existing account
            import json
            state_data = json.loads(state) if state else {}
            user_id = state_data.get("userId")
            
            # Check for existing accounts
            google_user_obj = get_user_by_google_id(db, google_id)
            email_user = None
            if email:
                email_user = get_user_by_email(db, email)
            
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
                    db.commit()
                    db.refresh(user)
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
                db.commit()
                db.refresh(user)
            
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
            detail=f"Google OAuth error: {str(e)}"
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
    username = request.username
    # Get or create user by discord_id
    user = get_user_by_discord_id(db, discord_id)
    
    if not user:
        # Create ghost account
        user = User(
            discord_id=discord_id,
            username=username,
            email=None,
            hashed_password=None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update username if changed
        if user.username != username:
            user.username = username
            db.commit()
            db.refresh(user)
    
    # Create token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

