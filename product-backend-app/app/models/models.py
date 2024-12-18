from datetime import datetime, timezone
from sqlalchemy import JSON, Column, DateTime, Float, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class ConfigurationTable(Base):
    __tablename__ = "configuration_table"

    id = Column(Integer, primary_key=True, index=True)
    config_name = Column(String, unique=True, nullable=False)
    config_value = Column(String)

class DatasetMasterTable(Base):
    __tablename__ = "dataset_master_table"

    id = Column(Integer, primary_key=True, index=True)
    dataset_name = Column(String, unique=True, nullable=False)
    dataset_workflow_url = Column(String, nullable=False)
    dataset_desc = Column(String)
    dataset_model_template = Column(String, nullable=False)
    dataset_status = Column(String)
    dataset_system_prompt = Column(String)
    dataset_origin = Column(String, nullable=False)
    dataset_domain = Column(String, nullable=False)
    dataset_filepath = Column(String)
    finetunes = relationship("FinetuneMasterTable", back_populates="dataset")

class DatasetOutputTable(Base):
    __tablename__ = "dataset_output_table"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("dataset_master_table.id"), nullable=False)
    chunk_text = Column(String)
    jsonl_content = Column(String)
    filename = Column(String)

class DatasetTemplateTable(Base):
    __tablename__ = "dataset_template_table"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, unique=True, nullable=False)
    model_template = Column(String, nullable=False)
    model_description = Column(String)

class FinetuneMasterTable(Base):
    __tablename__ = "finetune_master_table"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, unique=True, nullable=False)
    model_owner = Column(String, nullable=False)
    model_type = Column(String, nullable=False)
    base_model = Column(String, nullable=False)
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
    finetuned_model_name = Column(String, nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), 
                       onupdate=lambda: datetime.now(timezone.utc))

    dataset = relationship("DatasetMasterTable", back_populates="finetunes")
    
class FineTuneTask(Base):
    __tablename__ = "finetune_tasks"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, unique=True, index=True)
    config_id = Column(Integer, ForeignKey("finetune_configs.id"))
    status = Column(String)
    current_step = Column(String, nullable=True)
    progress = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    result = Column(JSON, nullable=True)
    error = Column(String, nullable=True)
    metrics = Column(JSON, nullable=True)
