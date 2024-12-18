# /Users/dan/workspace/projects/product/product-backend-app/app/api/finetune.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter()

@router.post("/finetune/", response_model=schemas.Finetune)
def create_finetune(finetune: schemas.FinetuneCreate, db: Session = Depends(get_db)):
    db_finetune = models.FinetuneMasterTable(**finetune.dict())
    db.add(db_finetune)
    db.commit()
    db.refresh(db_finetune)
    return db_finetune

@router.get("/finetune/", response_model=List[schemas.Finetune])
def read_finetunes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    finetunes = db.query(models.FinetuneMasterTable).offset(skip).limit(limit).all()
    return finetunes

@router.get("/finetune/{finetune_id}", response_model=schemas.Finetune)
def read_finetune(finetune_id: int, db: Session = Depends(get_db)):
    finetune = db.query(models.FinetuneMasterTable).filter(models.FinetuneMasterTable.id == finetune_id).first()
    if finetune is None:
        raise HTTPException(status_code=404, detail="Finetune configuration not found")
    return finetune

@router.put("/finetune/{finetune_id}", response_model=schemas.Finetune)
def update_finetune(finetune_id: int, finetune: schemas.FinetuneUpdate, db: Session = Depends(get_db)):
    db_finetune = db.query(models.FinetuneMasterTable).filter(models.FinetuneMasterTable.id == finetune_id).first()
    if db_finetune is None:
        raise HTTPException(status_code=404, detail="Finetune configuration not found")
    for key, value in finetune.dict(exclude_unset=True).items():
        setattr(db_finetune, key, value)
    db.commit()
    db.refresh(db_finetune)
    return db_finetune

@router.delete("/finetune/{finetune_id}", response_model=schemas.Finetune)
def delete_finetune(finetune_id: int, db: Session = Depends(get_db)):
    finetune = db.query(models.FinetuneMasterTable).filter(models.FinetuneMasterTable.id == finetune_id).first()
    if finetune is None:
        raise HTTPException(status_code=404, detail="Finetune configuration not found")
    db.delete(finetune)
    db.commit()
    return finetune

@router.get("/status/{task_id}")
async def get_task_status(task_id: str, db: Session = Depends(get_db)):
    """Get the status of a fine-tuning task"""
    task = db.query(models.FineTuneTask).filter(models.FineTuneTask.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {
        "task_id": task.task_id,
        "config_id": task.config_id,
        "status": task.status,
        "current_step": task.current_step,
        "progress": task.progress,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "result": task.result,
        "error": task.error,
        "metrics": task.metrics
    }
