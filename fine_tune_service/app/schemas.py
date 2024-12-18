# app/schemas.py
from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, List
from datetime import datetime


class FineTuneRequest(BaseModel):
    config_id: str
    
class FineTuneConfig(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    config_id: str
    model_name: str
    model_owner: str
    model_type: str
    base_model: str
    dataset_id: str
    num_iterations: int
    steps_per_eval: int
    num_layers: int
    learning_rate: float
    batch_size: int
    train_split: float
    validation_split: float
    test_split: float
    processed_file_full_path: str
    finetuned_model_name: str
    status: str

class TaskStatus(BaseModel):
    task_id: str
    status: str
    current_step: Optional[str]
    progress: float
    error: Optional[str]
    metrics: Optional[Dict]
    result: Optional[Dict]
