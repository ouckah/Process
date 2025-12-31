from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from api.routes import processes, auth, stages, feedback
from api.database import init_db

app = FastAPI()

# Get allowed origins from environment or use defaults
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
]

# Add production frontend URL if provided
if FRONTEND_URL and FRONTEND_URL not in allowed_origins:
    allowed_origins.append(FRONTEND_URL)

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
    init_db()

# Register routers
app.include_router(auth.router)
app.include_router(processes.router)
app.include_router(stages.router)
app.include_router(feedback.router)


@app.get("/")
def read_root():
    return {"Hello": "World"}