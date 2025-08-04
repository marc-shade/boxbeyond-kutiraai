# src/workflow_engine/schemas.py
from pydantic import BaseModel
from typing import List, Dict, Optional

class InputParameter(BaseModel):
    name: str
    description: str
    type: str  # e.g., "string", "boolean", "int"
    required: bool
    default: Optional[bool] = None

class Agent(BaseModel):
    role: str
    name: str
    goal: str
    backstory: str
    verbose: bool
    allow_delegation: bool
    temperature: float
    max_iter: int

class Task(BaseModel):
    name: str
    description: str
    agent: str  # Reference to agent's ID (key in the agents dictionary)
    expected_output: str

class WorkflowCreate(BaseModel):
    name: str
    description: str
    config: dict  # Store inputs and settings as a dictionary
    agents: Dict[str, Agent]  # Store agents as a dictionary with IDs as keys
    tasks: List[Task]  # Store tasks as a list of dictionaries

class WorkflowInDB(WorkflowCreate):
    id: int  # This will be added by the database

class WorkflowUpdate(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    config: Optional[dict] = None
    agents: Optional[Dict[str, Agent]] = None  # Allow updating agents as a dictionary
    tasks: Optional[List[Task]] = None  # Allow updating tasks as a list of dictionaries
