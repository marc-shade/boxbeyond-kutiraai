from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter()

@router.post("/dataset_templates/", response_model=schemas.DatasetTemplate)
def create_dataset_template(dataset_template: schemas.DatasetTemplateCreate, db: Session = Depends(get_db)):
    db_dataset_template = models.DatasetTemplateTable(**dataset_template.dict())
    db.add(db_dataset_template)
    db.commit()
    db.refresh(db_dataset_template)
    return db_dataset_template

@router.get("/dataset_templates/", response_model=List[schemas.DatasetTemplate])
def read_dataset_templates(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    dataset_templates = db.query(models.DatasetTemplateTable).offset(skip).limit(limit).all()
    return dataset_templates

@router.get("/dataset_templates/{template_id}", response_model=schemas.DatasetTemplate)
def read_dataset_template(template_id: int, db: Session = Depends(get_db)):
    dataset_template = db.query(models.DatasetTemplateTable).filter(models.DatasetTemplateTable.id == template_id).first()
    if dataset_template is None:
        raise HTTPException(status_code=404, detail="Dataset template not found")
    return dataset_template

@router.put("/dataset_templates/{template_id}", response_model=schemas.DatasetTemplate)
def update_dataset_template(template_id: int, dataset_template: schemas.DatasetTemplateCreate, db: Session = Depends(get_db)):
    db_dataset_template = db.query(models.DatasetTemplateTable).filter(models.DatasetTemplateTable.id == template_id).first()
    if db_dataset_template is None:
        raise HTTPException(status_code=404, detail="Dataset template not found")
    for key, value in dataset_template.dict().items():
        setattr(db_dataset_template, key, value)
    db.commit()
    db.refresh(db_dataset_template)
    return db_dataset_template

@router.delete("/dataset_templates/{template_id}", response_model=schemas.DatasetTemplate)
def delete_dataset_template(template_id: int, db: Session = Depends(get_db)):
    dataset_template = db.query(models.DatasetTemplateTable).filter(models.DatasetTemplateTable.id == template_id).first()
    if dataset_template is None:
        raise HTTPException(status_code=404, detail="Dataset template not found")
    db.delete(dataset_template)
    db.commit()
    return dataset_template