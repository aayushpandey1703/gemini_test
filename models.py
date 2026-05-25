from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel

# ----------------- Database Tables -----------------

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True, nullable=False)
    email: str = Field(unique=True, index=True, nullable=False)
    hashed_password: str = Field(nullable=False)
    
    # Relationship: One user has many tasks
    tasks: List["Task"] = Relationship(back_populates="owner", cascade_delete=True)


class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True, nullable=False)
    description: Optional[str] = Field(default=None)
    completed: bool = Field(default=False, nullable=False)
    owner_id: int = Field(foreign_key="user.id", nullable=False)
    
    # Relationship: Each task belongs to a user
    owner: User = Relationship(back_populates="tasks")


# ----------------- API schemas (Pydantic / SQLModel) -----------------

class UserCreate(SQLModel):
    username: str
    email: str
    password: str


class UserResponse(SQLModel):
    id: int
    username: str
    email: str


class TaskCreate(SQLModel):
    title: str
    description: Optional[str] = None
    completed: bool = False


class TaskUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None


class TaskResponse(SQLModel):
    id: int
    title: str
    description: Optional[str]
    completed: bool
    owner_id: int


# Token Schemas for Auth
class Token(SQLModel):
    access_token: str
    token_type: str


class TokenData(SQLModel):
    username: Optional[str] = None
