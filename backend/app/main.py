import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from app.api.farms import router as farms_router
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import router
from app.api.weather import router as weather_router
from app.db.database import engine
from app.db.bootstrap import initialize_database

logging.basicConfig(level=settings.log_level, format="%(asctime)s %(levelname)s %(name)s %(message)s")

@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.database_url == "sqlite:////tmp/agrios.db":
        logging.getLogger(__name__).warning("Demo storage is ephemeral on Vercel; configure DATABASE_URL for persistent history")
    initialize_database(engine)
    yield

app = FastAPI(title="AgriOS AI", version="0.2.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["GET", "POST", "PUT"], allow_headers=["Content-Type"])
app.include_router(router)
app.include_router(weather_router)
app.include_router(farms_router)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.exception_handler(SQLAlchemyError)
async def database_error(request: Request, exc: SQLAlchemyError):
    logging.getLogger(__name__).error("Database operation failed: %s", type(exc).__name__)
    return JSONResponse(status_code=503, content={"detail": "Farm data temporarily unavailable. Please try again."})
