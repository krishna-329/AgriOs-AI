from app.config import settings
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import NullPool

class Base(DeclarativeBase):
    pass

def build_engine(database_url: str):
    if make_url(database_url).get_backend_name() == "sqlite":
        return create_engine(database_url, connect_args={"check_same_thread": False}, pool_pre_ping=True)
    # Managed transaction poolers own pooling. Do not keep idle connections in
    # every serverless instance; disable prepared statements for pooler safety.
    return create_engine(database_url, poolclass=NullPool, pool_pre_ping=True,
                         connect_args={"connect_timeout": settings.database_connect_timeout, "prepare_threshold": None},
                         hide_parameters=True)

DATABASE_URL = settings.database_url
engine = build_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def get_session():
    with SessionLocal() as session:
        try:
            yield session
        except Exception:
            session.rollback()
            raise
