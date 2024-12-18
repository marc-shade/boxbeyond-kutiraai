from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter()

@router.post("/dataset_masters/", response_model=schemas.DatasetMaster)
def create_dataset_master(dataset: schemas.DatasetMasterCreate, db: Session = Depends(get_db)):
    db_dataset = models.DatasetMasterTable(**dataset.dict())
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)
    return db_dataset

@router.get("/dataset_masters/", response_model=List[schemas.DatasetMaster])
def read_dataset_masters(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    dataset_masters = db.query(models.DatasetMasterTable).offset(skip).limit(limit).all()
    return dataset_masters

@router.get("/dataset_masters/{dataset_id}", response_model=schemas.DatasetMaster)
def read_dataset_master(dataset_id: int, db: Session = Depends(get_db)):
    dataset_master = db.query(models.DatasetMasterTable).filter(models.DatasetMasterTable.id == dataset_id).first()
    if dataset_master is None:
        raise HTTPException(status_code=404, detail="Dataset master not found")
    return dataset_master

@router.put("/dataset_masters/{dataset_id}", response_model=schemas.DatasetMaster)
def update_dataset_master(dataset_id: int, dataset: schemas.DatasetMasterCreate, db: Session = Depends(get_db)):
    db_dataset = db.query(models.DatasetMasterTable).filter(models.DatasetMasterTable.id == dataset_id).first()
    if db_dataset is None:
        raise HTTPException(status_code=404, detail="Dataset master not found")
    for key, value in dataset.dict().items():
        setattr(db_dataset, key, value)
    db.commit()
    db.refresh(db_dataset)
    return db_dataset

@router.delete("/dataset_masters/{dataset_id}", response_model=schemas.DatasetMaster)
def delete_dataset_master(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.query(models.DatasetMasterTable).filter(models.DatasetMasterTable.id == dataset_id).first()
    if dataset is None:
        raise HTTPException(status_code=404, detail="Dataset master not found")
    db.delete(dataset)
    db.commit()
    return dataset