from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from routes import processes, auth, stages, feedback, profiles, comments
from database import init_db

app = FastAPI()

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

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    try:
        init_db()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Warning: Database initialization failed: {e}")
        print("Server will continue, but database operations may fail")

# Register routers
app.include_router(auth.router)
app.include_router(processes.router)
app.include_router(stages.router)
app.include_router(feedback.router)
app.include_router(profiles.router)
app.include_router(comments.router)


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/health")
def health_check():
    """Health check endpoint for Railway and monitoring."""
    return {"status": "healthy", "service": "api"}