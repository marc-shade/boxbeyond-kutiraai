from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter()

@router.post("/dataset_outputs/", response_model=schemas.DatasetOutput)
def create_dataset_output(dataset_output: schemas.DatasetOutputCreate, db: Session = Depends(get_db)):
    db_dataset_output = models.DatasetOutputTable(**dataset_output.dict())
    db.add(db_dataset_output)
    db.commit()
    db.refresh(db_dataset_output)
    return db_dataset_output

@router.get("/dataset_outputs/", response_model=List[schemas.DatasetOutput])
def read_dataset_outputs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    dataset_outputs = db.query(models.DatasetOutputTable).offset(skip).limit(limit).all()
    return dataset_outputs

@router.get("/dataset_outputs/{output_id}", response_model=schemas.DatasetOutput)
def read_dataset_output(output_id: int, db: Session = Depends(get_db)):
    dataset_output = db.query(models.DatasetOutputTable).filter(models.DatasetOutputTable.id == output_id).first()
    if dataset_output is None:
        raise HTTPException(status_code=404, detail="Dataset output not found")
    return dataset_output

@router.put("/dataset_outputs/{output_id}", response_model=schemas.DatasetOutput)
def update_dataset_output(output_id: int, dataset_output: schemas.DatasetOutputCreate, db: Session = Depends(get_db)):
    db_dataset_output = db.query(models.DatasetOutputTable).filter(models.DatasetOutputTable.id == output_id).first()
    if db_dataset_output is None:
        raise HTTPException(status_code=404, detail="Dataset output not found")
    for key, value in dataset_output.dict().items():
        setattr(db_dataset_output, key, value)
    db.commit()
    db.refresh(db_dataset_output)
    return db_dataset_output

@router.delete("/dataset_outputs/{output_id}", response_model=schemas.DatasetOutput)
def delete_dataset_output(output_id: int, db: Session = Depends(get_db)):
    dataset_output = db.query(models.DatasetOutputTable).filter(models.DatasetOutputTable.id == output_id).first()
    if dataset_output is None:
        raise HTTPException(status_code=404, detail="Dataset output not found")
    db.delete(dataset_output)
    db.commit()
    return dataset_output

# below method will fetch all the records based on dataset_id
@router.get("/dataset_outputs/dataset/{dataset_id}", response_model=List[schemas.DatasetOutput])
def read_dataset_outputs_by_dataset_id(dataset_id: int, db: Session = Depends(get_db)):
    dataset_outputs = db.query(models.DatasetOutputTable).filter(models.DatasetOutputTable.dataset_id == dataset_id).all()
    return dataset_outputs