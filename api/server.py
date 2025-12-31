from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import processes, auth, stages, feedback
from api.database import init_db

app = FastAPI()


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React default port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
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