# src/workflow_engine/crud.py
from sqlalchemy.orm import Session
from . import models, schemas
from datetime import datetime
from typing import Optional, List

class WorkflowRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_workflow(self, name: str) -> Optional[models.Workflow]:
        return self.db.query(models.Workflow).filter(
            models.Workflow.name == name,
            models.Workflow.is_active == True
        ).first()

    def get_workflows(self, skip: int = 0, limit: int = 100) -> List[models.Workflow]:
        return self.db.query(models.Workflow).filter(
            models.Workflow.is_active == True
        ).offset(skip).limit(limit).all()

    def create_workflow(self, workflow: schemas.WorkflowCreate) -> models.Workflow:
        db_workflow = models.Workflow(
            name=workflow.name,
            description=workflow.description,
            tags=workflow.tags,
            config=workflow.config,
            agents=workflow.agents,
            tasks=workflow.tasks,
            author=workflow.author,
            version="1.0.0"
        )
        self.db.add(db_workflow)
        self.db.commit()
        self.db.refresh(db_workflow)
        return db_workflow

    def update_workflow(self, name: str, workflow: schemas.WorkflowUpdate) -> Optional[models.Workflow]:
        db_workflow = self.get_workflow(name)
        if db_workflow:
            # Create new version
            version = models.WorkflowVersion(
                workflow_id=db_workflow.id,
                version=db_workflow.version,
                config=db_workflow.config,
                agents=db_workflow.agents,
                tasks=db_workflow.tasks,
                created_by=db_workflow.author
            )
            self.db.add(version)
            
            # Update workflow
            for key, value in workflow.dict(exclude_unset=True).items():
                setattr(db_workflow, key, value)
            db_workflow.version = self._increment_version(db_workflow.version)
            db_workflow.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(db_workflow)
        return db_workflow

    def delete_workflow(self, name: str) -> bool:
        db_workflow = self.get_workflow(name)
        if db_workflow:
            db_workflow.is_active = False
            self.db.commit()
            return True
        return False

    def _increment_version(self, version: str) -> str:
        major, minor, patch = map(int, version.split('.'))
        return f"{major}.{minor}.{patch + 1}"