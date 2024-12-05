# src/workflow_engine/schemas.py
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    config: Dict[str, Any]
    agents: Dict[str, Any]
    tasks: Dict[str, Any]

class WorkflowCreate(WorkflowBase):
    author: str

class WorkflowUpdate(WorkflowBase):
    author: str

class WorkflowInDB(WorkflowBase):
    id: int
    version: str
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        orm_mode = True