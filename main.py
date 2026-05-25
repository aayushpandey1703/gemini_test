from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlmodel import Session

from database import get_db, create_db_and_tables
from models import (
    User, UserCreate, UserResponse,
    Task, TaskCreate, TaskUpdate, TaskResponse,
    Token
)
from auth import create_access_token, get_current_user, verify_password
import crud


# ----------------- Lifespan (Startup/Shutdown) -----------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and tables on application startup
    create_db_and_tables()
    yield


# Initialize FastAPI app with lifespan context and documentation title
app = FastAPI(
    title="Gemini Task & Note Manager",
    description="A secure and responsive note-taking application using FastAPI and SQLModel.",
    version="1.0.0",
    lifespan=lifespan
)


# ----------------- Authentication Endpoints -----------------

@app.post("/auth/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserCreate, session: Session = Depends(get_db)):
    """Registers a new user after verifying username/email uniqueness."""
    db_user_username = crud.get_user_by_username(session, user_in.username)
    if db_user_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    db_user_email = crud.get_user_by_email(session, user_in.email)
    if db_user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    return crud.create_user(session, user_in)


@app.post("/auth/login", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_db)
):
    """Authenticates user credentials and returns a JWT access token."""
    user = crud.get_user_by_username(session, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/auth/me", response_model=UserResponse)
def get_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieves the profile information of the currently logged-in user."""
    return current_user


# ----------------- Task / Note Endpoints -----------------

@app.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db)
):
    """Creates a new task/note linked to the authenticated user."""
    return crud.create_task_for_user(session, task_in, current_user.id)


@app.get("/tasks", response_model=List[TaskResponse])
def read_tasks(
    completed: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db)
):
    """Retrieves all tasks for the logged-in user, with optional completion filter."""
    return crud.get_tasks_for_user(session, current_user.id, completed)


@app.get("/tasks/{task_id}", response_model=TaskResponse)
def read_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db)
):
    """Retrieves details of a specific task belonging to the logged-in user."""
    task = crud.get_task_by_id(session, task_id)
    if not task or task.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or unauthorized access"
        )
    return task


@app.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_in: TaskUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db)
):
    """Updates fields of an existing task owned by the logged-in user."""
    task = crud.get_task_by_id(session, task_id)
    if not task or task.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or unauthorized access"
        )
    return crud.update_task_for_user(session, task, task_in)


@app.patch("/tasks/{task_id}/complete", response_model=TaskResponse)
def toggle_task_complete(
    task_id: int,
    completed: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db)
):
    """Toggles or sets the completion status of a specific task owned by the user."""
    task = crud.get_task_by_id(session, task_id)
    if not task or task.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or unauthorized access"
        )
    
    # If explicit value is provided, use it. Otherwise, toggle the current state.
    new_completed_status = completed if completed is not None else not task.completed
    task_update = TaskUpdate(completed=new_completed_status)
    return crud.update_task_for_user(session, task, task_update)


@app.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db)
):
    """Deletes a task belonging to the logged-in user."""
    task = crud.get_task_by_id(session, task_id)
    if not task or task.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found or unauthorized access"
        )
    crud.delete_task_for_user(session, task)
    return None


# ----------------- Static Frontend Delivery -----------------

# Mount the static directory for CSS, JS, and Assets
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_index():
    """Serves the main single page application UI at the root domain."""
    return FileResponse("static/index.html")
