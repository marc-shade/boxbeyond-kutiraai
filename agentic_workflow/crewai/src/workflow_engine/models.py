# src/workflow_engine/models.py
from sqlalchemy import Column, Integer, String, JSON, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Workflow(Base):
    __tablename__ = 'workflows'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(Text)
    version = Column(String(50))
    author = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    tags = Column(JSON)
    config = Column(JSON, nullable=False)
    agents = Column(JSON, nullable=False)
    tasks = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True)
    versions = relationship("WorkflowVersion", back_populates="workflow")

class WorkflowVersion(Base):
    __tablename__ = 'workflow_versions'
    
    id = Column(Integer, primary_key=True)
    workflow_id = Column(Integer, ForeignKey('workflows.id'))
    version = Column(String(50))
    config = Column(JSON, nullable=False)
    agents = Column(JSON, nullable=False)
    tasks = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String(255))
    workflow = relationship("Workflow", back_populates="versions")