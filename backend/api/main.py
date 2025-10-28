from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.db_config import lifespan
from api.routes import router

app = FastAPI(
    title="RubberDuck - AI Concept Explainer",
    description="AI-powered programming concept explainer",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)


@app.get("/")
async def root():
    return {"message": "RubberDuck API is running", "version": "1.0.0"}