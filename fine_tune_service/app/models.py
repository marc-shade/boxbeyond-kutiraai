# app/models.py
from sqlalchemy import Column, String, DateTime, JSON, Integer, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class FineTuneTask(Base):
    __tablename__ = "finetune_tasks"
    
    task_id = Column(String, primary_key=True)
    config_id = Column(String, nullable=False)
    status = Column(String, nullable=False)  # PREPARING, FINETUNING, FUSING, CONVERTING, CREATING_MODEL, COMPLETED, FAILED
    current_step = Column(String, nullable=True)
    progress = Column(Float, default=0.0)  # 0 to 100
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    result = Column(JSON, nullable=True)
    error = Column(String, nullable=True)
    metrics = Column(JSON, nullable=True)  # Store training metrics


class FineTuneConfig(Base):
    __tablename__ = "finetune_master_table"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, unique=True, nullable=False)
    base_model = Column(String, nullable=False)
    model_owner = Column(String, nullable=False)
    model_type = Column(String, nullable=False)
    dataset_id = Column(Integer, ForeignKey("dataset_master_table.id"), nullable=False)
    num_iterations = Column(Integer, default=1000)
    steps_per_eval = Column(Integer, default=100)
    num_layers = Column(Integer, default=16)
    learning_rate = Column(String, default="1e-5")
    batch_size = Column(Integer, default=25)
    train_split = Column(Integer, default=70)
    validation_split = Column(Integer, default=20)
    test_split = Column(Integer, default=10)
    processed_file_full_path = Column(String, nullable=False)
    finetuned_model_name = Column(String, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.UTC))
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.UTC), 
                       onupdate=lambda: datetime.datetime.now(datetime.UTC))
  