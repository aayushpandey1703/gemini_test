from typing import List, Optional
from sqlmodel import Session, select
from models import User, UserCreate, Task, TaskCreate, TaskUpdate
from auth import get_password_hash


# ----------------- User DB Operations -----------------

def get_user_by_username(session: Session, username: str) -> Optional[User]:
    """Retrieves a user by their unique username."""
    statement = select(User).where(User.username == username)
    return session.exec(statement).first()


def get_user_by_email(session: Session, email: str) -> Optional[User]:
    """Retrieves a user by their unique email address."""
    statement = select(User).where(User.email == email)
    return session.exec(statement).first()


def create_user(session: Session, user_create: UserCreate) -> User:
    """Hashes the password and creates a new User in the database."""
    hashed_pw = get_password_hash(user_create.password)
    db_user = User(
        username=user_create.username,
        email=user_create.email,
        hashed_password=hashed_pw
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


# ----------------- Task DB Operations -----------------

def get_tasks_for_user(
    session: Session, 
    user_id: int, 
    completed: Optional[bool] = None
) -> List[Task]:
    """Retrieves all tasks belonging to a user, optionally filtering by completion status."""
    statement = select(Task).where(Task.owner_id == user_id)
    if completed is not None:
        statement = statement.where(Task.completed == completed)
    return session.exec(statement).all()


def get_task_by_id(session: Session, task_id: int) -> Optional[Task]:
    """Retrieves a specific task by its unique ID."""
    return session.get(Task, task_id)


def create_task_for_user(session: Session, task_create: TaskCreate, user_id: int) -> Task:
    """Creates a new task linked to the specified user."""
    db_task = Task(
        title=task_create.title,
        description=task_create.description,
        completed=task_create.completed,
        owner_id=user_id
    )
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task


def update_task_for_user(session: Session, db_task: Task, task_update: TaskUpdate) -> Task:
    """Updates selected fields of an existing task."""
    task_data = task_update.model_dump(exclude_unset=True)
    for key, value in task_data.items():
        setattr(db_task, key, value)
    
    session.add(db_task)
    session.commit()
    session.refresh(db_task)
    return db_task


def delete_task_for_user(session: Session, db_task: Task) -> None:
    """Deletes a task from the database."""
    session.delete(db_task)
    session.commit()
