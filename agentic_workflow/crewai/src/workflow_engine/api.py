# src/workflow_engine/api.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
from .engine import WorkflowEngine
from .exceptions import WorkflowNotFoundError, ConfigurationError, WorkflowExecutionError, ValidationError
from sqlalchemy.orm import Session
from typing import List
from . import crud, models, schemas
from .database import engine, get_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Create database tables
models.Base.metadata.create_all(bind=engine)

@app.post("/workflows/", response_model=schemas.WorkflowInDB)
def create_workflow(workflow: schemas.WorkflowCreate, db: Session = Depends(get_db)):
    repo = crud.WorkflowRepository(db)
    existing_workflow = repo.get_workflow(workflow.name)
    if existing_workflow:
        raise HTTPException(status_code=400, detail="Workflow already exists")
    return repo.create_workflow(workflow)

@app.get("/workflows/", response_model=List[schemas.WorkflowInDB])
def list_workflows(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    repo = crud.WorkflowRepository(db)
    return repo.get_workflows(skip=skip, limit=limit)

@app.get("/workflows/{name}", response_model=schemas.WorkflowInDB)
def get_workflow(name: str, db: Session = Depends(get_db)):
    repo = crud.WorkflowRepository(db)
    workflow = repo.get_workflow(name)
    if workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@app.put("/workflows/{name}", response_model=schemas.WorkflowInDB)
def update_workflow(
    name: str,
    workflow: schemas.WorkflowUpdate,
    db: Session = Depends(get_db)
):
    repo = crud.WorkflowRepository(db)
    updated_workflow = repo.update_workflow(name, workflow)
    if updated_workflow is None:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return updated_workflow

@app.delete("/workflows/{name}")
def delete_workflow(name: str, db: Session = Depends(get_db)):
    repo = crud.WorkflowRepository(db)
    if not repo.delete_workflow(name):
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {"message": "Workflow deleted successfully"}

class WorkflowRequest(BaseModel):
    workflow_name: str
    inputs: Dict[str, Any]
    trace: Optional[bool] = False

def serialize_crew_output(crew_output) -> Dict[str, Any]:
    """Convert CrewOutput to a serializable dictionary"""
    return {
        "final_output": str(crew_output)
    }
    
@app.post("/workflows/execute")
async def execute_workflow(request: WorkflowRequest, db: Session = Depends(get_db)):
    try:
        # Modify this to use proper db dependency
        engine = WorkflowEngine(db)
        traces = [] if request.trace else None
        
        try:
            crew, metadata = engine.create_crew(
                request.workflow_name, 
                inputs=request.inputs, 
                traces=traces
            )
        # Rest of your execution logic
        except WorkflowNotFoundError as e:
            raise HTTPException(
                status_code=404,
                detail={"message": str(e), "details": e.details}
            )
        except (ConfigurationError, ValidationError) as e:
            raise HTTPException(
                status_code=400,
                detail={"message": str(e), "details": e.details}
            )
        
        try:
            # execute the result
            result = crew.kickoff(inputs=request.inputs)
        except TimeoutError as e:
            raise HTTPException(
                status_code=408,
                detail={"message": str(e), "details": e.details}
            )
        except WorkflowExecutionError as e:
            raise HTTPException(
                status_code=500,
                detail={"message": str(e), "details": e.details}
            )
        
        # Prepare response
        response = {
            "workflow_name": request.workflow_name,
            "workflow_version": metadata.version,
            "result": serialize_crew_output(result)
        }
        
        # If tracing was requested, include the traces in response
        if traces is not None:
            response["traces"] = traces
            
        return JSONResponse(content=response)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Internal server error",
                "details": {"error": str(e)}
            }
        )