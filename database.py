import os
from sqlmodel import SQLModel, create_engine, Session

# Database path in the root folder of the project
DATABASE_NAME = "tasks.db"
DATABASE_URL = f"sqlite:///{DATABASE_NAME}"

# Disable same-thread checks for SQLite in asynchronous/multi-threaded contexts
connect_args = {"check_same_thread": False}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

def create_db_and_tables():
    """Initializes the database tables based on metadata models."""
    SQLModel.metadata.create_all(engine)

def get_db():
    """Dependency generator that provides a new database session for each request."""
    with Session(engine) as session:
        yield session
