# src/workflow_engine/api.py
from fastapi import FastAPI, HTTPException, Depends, WebSocket
from fastapi.responses import JSONResponse
from starlette.websockets import WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, Dict, Any
import logging
from .engine import WorkflowEngine
from .exceptions import WorkflowNotFoundError, ConfigurationError, WorkflowExecutionError, ValidationError
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from . import crud, models, schemas
from .database import engine, get_db
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables if they don't exist yet.
models.Base.metadata.create_all(bind=engine)

# Global dictionary to store WebSocket connections
active_connections = {}

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint that verifies:
    1. API status
    2. Database connection
    """
    health_status = {
        "status": "healthy",
        "services": {
            "api": {"status": "healthy"},
            "database": {"status": "unknown"}
        }
    }

    # Check database connection using the injected db session
    try:
        db.execute(text("SELECT 1"))
        health_status["services"]["database"] = {"status": "healthy"}
    except Exception as e:
        health_status["services"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "unhealthy"

    # If any service is unhealthy, return 503
    if health_status["status"] != "healthy":
        raise HTTPException(
            status_code=503,
            detail=health_status
        )

    return health_status

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await websocket.accept()
    active_connections[client_id] = websocket
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        del active_connections[client_id]

@app.post("/workflows/", response_model=schemas.WorkflowInDB)
def create_workflow(workflow_data: schemas.WorkflowCreate, db: Session = Depends(get_db)):
   repo = crud.WorkflowRepository(db)
   
   existing_workflow = repo.get_workflow_name(workflow_data.name)
   
   if existing_workflow:
       raise HTTPException(status_code=400, detail="Workflow already exists")
   
   return repo.create_workflow(workflow_data)

@app.get("/workflows/", response_model=List[schemas.WorkflowInDB])
def list_workflows(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
   repo = crud.WorkflowRepository(db)
   
   return repo.get_workflows(skip=skip, limit=limit)

@app.get("/workflows/{id}", response_model=schemas.WorkflowInDB)
def get_workflow(id: int, db: Session = Depends(get_db)):
   repo = crud.WorkflowRepository(db)
   
   workflow = repo.get_workflow(id)
   
   if workflow is None:
       raise HTTPException(status_code=404, detail="Workflow not found")
   
   return workflow

@app.put("/workflows/{id}", response_model=schemas.WorkflowInDB)
def update_workflow(id: int, workflow_data: schemas.WorkflowUpdate, db: Session = Depends(get_db)):
   repo = crud.WorkflowRepository(db)

   updated_workflow = repo.update_workflow(id, workflow_data)

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
    iterations: Optional[int] = 1

def serialize_crew_output(crew_output, output_key: str) -> Dict[str, Any]:
    """Convert CrewOutput to a serializable dictionary
    
    Args:
        crew_output: The output to serialize
        output_key (str): The key to use in the output dictionary
    
    Returns:
        Dict[str, Any]: Dictionary with the specified key and crew output as value
    """
    return {
        output_key: str(crew_output)
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
            "token_usage": serialize_crew_output(result.token_usage, "metrics"),
            "result": serialize_crew_output(result, "final_output")
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
        
@app.post("/workflows/train")
async def train_workflow(request: WorkflowRequest, db: Session = Depends(get_db)):
    try:
        engine = WorkflowEngine(db)
        traces = [] if request.trace else None
        
        try:
            crew, metadata = engine.create_crew(
                request.workflow_name, 
                inputs=request.inputs, 
                traces=traces
            )
        except WorkflowNotFoundError as e:
            raise HTTPException(status_code=404, detail={"message": str(e), "details": e.details})
        except (ConfigurationError, ValidationError) as e:
            raise HTTPException(status_code=400, detail={"message": str(e), "details": e.details})
        
        try:
            # Modified training function to handle human interaction
            result = await train_with_human_interaction(crew, request)
        except TimeoutError as e:
            raise HTTPException(status_code=408, detail={"message": str(e), "details": e.details})
        except WorkflowExecutionError as e:
            raise HTTPException(status_code=500, detail={"message": str(e), "details": e.details})
        
        response = {
            "workflow_name": request.workflow_name,
            "workflow_version": metadata.version,
            "result": serialize_crew_output(result, "final_output")
        }
        
        if traces is not None:
            response["traces"] = traces
            
        return JSONResponse(content=response)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail={"message": "Internal server error", "details": {"error": str(e)}})
    

async def train_with_human_interaction(crew, request):
    for i in range(int(request.iterations)):
        iteration_result = crew.train(n_iterations=1, inputs=request.inputs, filename=f"{request.workflow_name}.pkl")
        
        # Send iteration result to the client
        if request.client_id in active_connections:
            await active_connections[request.client_id].send_json({
                "type": "iteration_result",
                "data": serialize_crew_output(iteration_result, f"iteration_{i+1}")
            })
        
        # Wait for human feedback
        if request.client_id in active_connections:
            feedback = await active_connections[request.client_id].receive_json()
            # Process the feedback and update the crew or training process as needed
            # This part depends on how you want to handle the feedback in your CrewAI implementation
    
    # Return the final result after all iterations
    return crew.train(n_iterations=1, inputs=request.inputs, filename=f"{request.workflow_name}.pkl")