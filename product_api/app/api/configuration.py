from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import models
from app.schemas import schemas

router = APIRouter()

@router.post("/configurations/", response_model=schemas.Configuration)
def create_configuration(configuration: schemas.ConfigurationCreate, db: Session = Depends(get_db)):
    db_configuration = models.ConfigurationTable(**configuration.dict())
    db.add(db_configuration)
    db.commit()
    db.refresh(db_configuration)
    return db_configuration

@router.get("/configurations/", response_model=List[schemas.Configuration])
def read_configurations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    configurations = db.query(models.ConfigurationTable).offset(skip).limit(limit).all()
    return configurations

@router.get("/configurations/{configuration_name}", response_model=schemas.Configuration)
def read_configuration_by_name(configuration_name: str, db: Session = Depends(get_db)):
    configuration = db.query(models.ConfigurationTable).filter(models.ConfigurationTable.config_name == configuration_name).first()
    if configuration is None:
        raise HTTPException(status_code=404, detail="Configuration not found")
    return configuration

@router.put("/configurations/{configuration_id}", response_model=schemas.Configuration)
def update_configuration(configuration_id: int, configuration: schemas.ConfigurationCreate, db: Session = Depends(get_db)):
    db_configuration = db.query(models.ConfigurationTable).filter(models.ConfigurationTable.id == configuration_id).first()
    if db_configuration is None:
        raise HTTPException(status_code=404, detail="Configuration not found")
    for key, value in configuration.dict().items():
        setattr(db_configuration, key, value)
    db.commit()
    db.refresh(db_configuration)
    return db_configuration

@router.delete("/configurations/{configuration_id}", response_model=schemas.Configuration)
def delete_configuration(configuration_id: int, db: Session = Depends(get_db)):
    configuration = db.query(models.ConfigurationTable).filter(models.ConfigurationTable.id == configuration_id).first()
    if configuration is None:
        raise HTTPException(status_code=404, detail="Configuration not found")
    db.delete(configuration)
    db.commit()
    return configuration