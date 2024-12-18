from typing import Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class ConfigurationBase(BaseModel):
    config_name: str
    config_value: str | None = None

class ConfigurationCreate(ConfigurationBase):
    pass

class Configuration(ConfigurationBase):
    id: int

    class Config:
        orm_mode = True

class DatasetMasterBase(BaseModel):
    dataset_name: str
    dataset_workflow_url: str
    dataset_desc: str | None = None
    dataset_model_template: str
    dataset_status: str | None = 'Pending'
    dataset_system_prompt: str | None = None
    dataset_origin: str
    dataset_domain: str
    dataset_filepath: str | None = None

class DatasetMasterCreate(DatasetMasterBase):
    pass

class DatasetMaster(DatasetMasterBase):
    id: int

    class Config:
        orm_mode = True

class DatasetOutputBase(BaseModel):
    dataset_id: int
    chunk_text: str | None = None
    jsonl_content: str | None = None
    filename: str | None = None

class DatasetOutputCreate(DatasetOutputBase):
    pass

class DatasetOutput(DatasetOutputBase):
    id: int

    class Config:
        orm_mode = True

class DatasetTemplateBase(BaseModel):
    model_name: str
    model_template: str
    model_description: str | None = None

class DatasetTemplateCreate(DatasetTemplateBase):
    pass

class DatasetTemplate(DatasetTemplateBase):
    id: int

    class Config:
        orm_mode = True
        
class FinetuneBase(BaseModel):
    model_name: str
    base_model: str
    model_owner: str
    dataset_id: int
    num_iterations: Optional[int] = 1000
    steps_per_eval: Optional[int] = 100
    num_layers: Optional[int] = 16
    learning_rate: Optional[str] = "1e-5"
    batch_size: Optional[int] = 25
    train_split: Optional[int] = 70
    validation_split: Optional[int] = 20
    test_split: Optional[int] = 10
    processed_file_full_path: str
    finetuned_model_name: str
    status: Optional[str] = "pending"

class FinetuneCreate(FinetuneBase):
    pass

class FinetuneUpdate(BaseModel):
    model_name: Optional[str] = None
    base_model: Optional[str] = None
    model_owner: Optional[str] = None
    model_type: Optional[str] = None
    dataset_id: Optional[int] = None
    num_iterations: Optional[int] = None
    steps_per_eval: Optional[int] = None
    num_layers: Optional[int] = None
    learning_rate: Optional[str] = None
    batch_size: Optional[int] = None
    train_split: Optional[int] = None
    validation_split: Optional[int] = None
    test_split: Optional[int] = None
    processed_file_full_path: Optional[str] = None
    finetuned_model_name: Optional[str] = None
    status: Optional[str] = None

class Finetune(FinetuneBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)