# src/workflow_engine/crud.py
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from . import models, schemas
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WorkflowRepository:
    
    def __init__(self, db: Session):
        self.db = db

    def get_workflow(self, id: int) -> Optional[models.Workflow]:
        return self.db.query(models.Workflow).filter(models.Workflow.id == id).first()
    
    def get_workflow_name(self, name: str) -> Optional[models.Workflow]:
        return self.db.query(models.Workflow).filter(models.Workflow.name == name).first()

    def get_workflows(self, skip: int = 0, limit: int = 100) -> List[models.Workflow]:
        return self.db.query(models.Workflow).offset(skip).limit(limit).all()

    def create_workflow(self, workflow_data: schemas.WorkflowCreate) -> models.Workflow:
        # Convert Agent objects to dictionaries using model_dump()
        agents_dict = {
            name: agent.model_dump() if hasattr(agent, 'model_dump') else vars(agent)
            for name, agent in workflow_data.agents.items()
        }
        
        db_workflow = models.Workflow(
            name=workflow_data.name,
            description=workflow_data.description,
            tags=workflow_data.config.get('tags', []),
            config=workflow_data.config,
            agents=agents_dict, 
            tasks=[task.dict() for task in workflow_data.tasks],  # Store tasks as JSON (list of dictionaries)
            author=workflow_data.config.get('author', 'Unknown'),
            version="1.0.0"
        )
        
        self.db.add(db_workflow)
        self.db.commit()
        self.db.refresh(db_workflow)
        
        return db_workflow

    def update_workflow(self, id: int, workflow_data: schemas.WorkflowUpdate) -> Optional[models.Workflow]:
        db_workflow = self.get_workflow(id)
        
        if not db_workflow:
            return None
        
        # Update fields while ensuring we handle unique constraints
        if 'name' in workflow_data.model_dump(exclude_unset=True):
            new_name = workflow_data.name
            # Check if a workflow with the new name already exists
            existing_workflow = self.get_workflow_name(new_name)
            if existing_workflow and existing_workflow.id != db_workflow.id:
                raise ValueError(f"A workflow with the name '{new_name}' already exists.")

        for key, value in workflow_data.model_dump(exclude_unset=True).items():
            setattr(db_workflow, key, value)

        try:
            self.db.commit()
        except IntegrityError:
            self.db.rollback()
            raise ValueError("Failed to update workflow due to integrity constraints.")

        return db_workflow

    def delete_workflow(self, name: str) -> bool:
        db_workflow = self.get_workflow(name)
        
        if not db_workflow:
            return False
        
        self.db.delete(db_workflow)
        self.db.commit()
        
        return True