from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from typing import Generator
import os

from app.core.config import settings

# Database URL from settings or environment
DATABASE_URL = settings.DATABASE_URL or "sqlite:///./scifig.db"

# Create SQLAlchemy engine
if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False},
        echo=False,  # Set to True for SQL logging in development
    )
else:
    engine = create_engine(
        DATABASE_URL,
        # Connection pool settings
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False,  # Set to True for SQL logging in development
    )

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our models (already defined in app.models.database)
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Database dependency for FastAPI endpoints.
    
    Usage:
    @app.get("/users/")
    def get_users(db: Session = Depends(get_db)):
        return db.query(User).all()
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize database tables.
    This is called during application startup.
    """
    # Import all models to ensure they are registered with SQLAlchemy
    from app.models.database import User, Project, Dataset, Analysis, Figure, ProjectCollaborator
    
    # Create all tables (only if they don't exist)
    Base.metadata.create_all(bind=engine)


def get_db_sync() -> Session:
    """
    Synchronous database session for use outside of FastAPI requests.
    Remember to close the session when done!
    
    Usage:
    db = get_db_sync()
    try:
        users = db.query(User).all()
        return users
    finally:
        db.close()
    """
    return SessionLocal()


async def check_db_connection() -> bool:
    """
    Check if database connection is working.
    Returns True if successful, False otherwise.
    """
    try:
        db = SessionLocal()
        # Simple query to test connection
        db.execute("SELECT 1")
        db.close()
        return True
    except Exception as e:
        print(f"Database connection failed: {e}")
        return False


class DatabaseManager:
    """
    Database management utilities for maintenance operations.
    """
    
    @staticmethod
    def create_tables():
        """Create all database tables"""
        from app.models.database import Base
        Base.metadata.create_all(bind=engine)
    
    @staticmethod
    def drop_tables():
        """Drop all database tables (use with caution!)"""
        from app.models.database import Base
        Base.metadata.drop_all(bind=engine)
    
    @staticmethod
    def get_table_info():
        """Get information about existing tables"""
        from sqlalchemy import inspect
        inspector = inspect(engine)
        return inspector.get_table_names()
    
    @staticmethod
    def reset_database():
        """Reset database by dropping and recreating all tables"""
        DatabaseManager.drop_tables()
        DatabaseManager.create_tables()
        print("Database reset completed")


# Health check function for monitoring
async def db_health_check() -> dict:
    """
    Comprehensive database health check.
    Returns status and connection info.
    """
    try:
        db = SessionLocal()
        
        # Test basic connection
        db.execute("SELECT 1")
        
        # Get database info
        result = db.execute("SELECT version()").fetchone()
        db_version = result[0] if result else "Unknown"
        
        # Get table count
        from app.models.database import Base
        table_count = len(Base.metadata.tables)
        
        db.close()
        
        return {
            "status": "healthy",
            "database_version": db_version,
            "tables_defined": table_count,
            "connection_url": DATABASE_URL.replace(DATABASE_URL.split('@')[0].split('//')[1], '***'),
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "connection_url": DATABASE_URL.replace(DATABASE_URL.split('@')[0].split('//')[1], '***'),
        } 