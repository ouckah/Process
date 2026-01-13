from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
import os
from dotenv import load_dotenv

# Load environment variables from .env file (for local development)
# In production (Railway), environment variables are provided directly, so this is harmless
load_dotenv()

from routes import processes, auth, stages, feedback, profiles, comments, analytics, guild_configs, notifications, explore, forum, email as email_routes
from database import init_db
from rate_limiter import limiter
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from email_service import process_pending_digests
import atexit

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Get allowed origins from environment or use defaults
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# Add production frontend URL if provided
if FRONTEND_URL:
    # Normalize URL - remove trailing slash
    normalized_url = FRONTEND_URL.rstrip('/')
    if normalized_url not in allowed_origins:
        allowed_origins.append(normalized_url)
    
    # Log for debugging
    print(f"FRONTEND_URL from env: {FRONTEND_URL}")
    print(f"Normalized URL: {normalized_url}")

# Log final allowed origins for debugging
print(f"Final CORS allowed origins: {allowed_origins}")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize email digest scheduler
scheduler = BackgroundScheduler()

def process_digests_job():
    """Background job to process pending email digests."""
    try:
        from database import SessionLocal
        db = SessionLocal()
        try:
            count = process_pending_digests(db)
            if count > 0:
                print(f"Processed {count} email digests")
        finally:
            db.close()
    except Exception as e:
        print(f"Error in email digest job: {e}")

# Initialize database and scheduler on startup
@app.on_event("startup")
def startup_event():
    try:
        init_db()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Warning: Database initialization failed: {e}")
        print("Server will continue, but database operations may fail")
    
    # Start email digest scheduler (runs every 30 minutes)
    try:
        scheduler.add_job(
            process_digests_job,
            trigger=IntervalTrigger(minutes=30),
            id='process_email_digests',
            name='Process Email Digests',
            replace_existing=True
        )
        scheduler.start()
        print("Email digest scheduler started (runs every 30 minutes)")
    except Exception as e:
        print(f"Warning: Failed to start email digest scheduler: {e}")
        print("Email digests can still be processed via /api/internal/process-email-digests endpoint")

@app.on_event("shutdown")
def shutdown_event():
    """Shutdown scheduler on app shutdown."""
    if scheduler.running:
        scheduler.shutdown()
        print("Email digest scheduler stopped")

# Register routers
app.include_router(auth.router)
app.include_router(processes.router)
app.include_router(stages.router)
app.include_router(feedback.router)
app.include_router(profiles.router)
app.include_router(comments.router)
app.include_router(analytics.router)
app.include_router(guild_configs.router)
app.include_router(notifications.router)
app.include_router(explore.router)
app.include_router(forum.router)
app.include_router(email_routes.router)


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/health")
def health_check():
    """Health check endpoint for Railway and monitoring."""
    return {"status": "healthy", "service": "api"}