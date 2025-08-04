# app/main.py
from fastapi import FastAPI, HTTPException, Depends
from .database import get_db, DatabaseInterface
from .celery_app import run_fine_tuning_pipeline
from .schemas import FineTuneRequest, TaskStatus
from celery.result import AsyncResult
from redis import Redis
from redis.exceptions import RedisError
import psycopg2
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from parent directory
load_dotenv(dotenv_path="../.env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check(db: DatabaseInterface = Depends(get_db)):
    """
    Health check endpoint that verifies:
    1. API is responding
    2. Database connection
    3. Redis connection
    4. Celery worker status
    """
    health_status = {
        "status": "healthy",
        "services": {
            "api": {"status": "healthy"},
            "database": {"status": "healthy"},
            "redis": {"status": "unknown"},
            "celery": {"status": "unknown"}
        }
    }

    # Check database connection
    is_healthy, error = db.check_health()
    if not is_healthy:
        health_status["services"]["database"] = {
            "status": "unhealthy",
            "error": error
        }
        health_status["status"] = "unhealthy"

    # Check Redis connection
    try:
        redis_client = Redis.from_url(app.state.redis_url)
        redis_client.ping()
        health_status["services"]["redis"] = {
            "status": "healthy"
        }
    except RedisError as e:
        health_status["services"]["redis"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "degraded"

    # Check Celery worker
    try:
        # First try to ping workers
        inspect = app.state.celery_app.control.inspect(timeout=3.0)
        ping_result = inspect.ping()
        
        if ping_result:
            # If ping successful, check for active workers
            active_workers = inspect.active()
            if active_workers:
                health_status["services"]["celery"] = {
                    "status": "healthy",
                    "workers": list(active_workers.keys())
                }
            else:
                health_status["services"]["celery"] = {
                    "status": "unhealthy",
                    "error": "Workers found but not active"
                }
                health_status["status"] = "degraded"
        else:
            health_status["services"]["celery"] = {
                "status": "unhealthy",
                "error": "No workers responded to ping"
            }
            health_status["status"] = "degraded"
            
    except (ConnectionError, TimeoutError) as e:
        health_status["services"]["celery"] = {
            "status": "unhealthy",
            "error": f"Connection error: {str(e)}"
        }
        health_status["status"] = "degraded"
    except Exception as e:
        health_status["services"]["celery"] = {
            "status": "unhealthy",
            "error": f"Unexpected error: {str(e)}"
        }
        health_status["status"] = "degraded"

    # If any service is unhealthy, return 503
    if health_status["status"] != "healthy":
        raise HTTPException(
            status_code=503,
            detail=health_status
        )

    return health_status


@app.post("/finetune/launch")
async def launch_fine_tuning(
    request: FineTuneRequest,
    db: DatabaseInterface = Depends(get_db)
):
    try:
        # Launch the Celery task
        task = run_fine_tuning_pipeline.delay(request.config_id)
        
        return {
            "task_id": task.id,
            "status": "PREPARING",
            "message": "Fine-tuning pipeline started"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/finetune/task/{config_id}")
async def get_task_status(
    config_id: str,
    db: DatabaseInterface = Depends(get_db)
) -> TaskStatus:
    try:
        task_record = db.get_task_status(config_id)
        
        if not task_record:
            raise HTTPException(status_code=404, detail="Task not found")
        
        return TaskStatus(
            task_id=task_record.task_id,
            status=task_record.status,
            current_step=task_record.current_step,
            progress=task_record.progress,
            error=task_record.error,
            metrics=task_record.metrics,
            result=task_record.result
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add startup event to store redis_url and celery_app in app state
@app.on_event("startup")
async def startup_event():
    from .celery_app import celery_app
    import os
    
    app.state.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    app.state.celery_app = celery_app