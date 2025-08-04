# app/database.py
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError
import os
from .models import FineTuneTask, FineTuneConfig
from .schemas import TaskStatus 
import os
from dotenv import load_dotenv

# Load environment variables from parent directory
load_dotenv(dotenv_path="../.env")

class DatabaseInterface:
    def __init__(self):
        self.connection_string = os.getenv('DATABASE_URL')
        if not self.connection_string:
            raise ValueError("DATABASE_URL environment variable is not set")
        
        self.engine = create_engine(self.connection_string)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

    def check_health(self) -> tuple[bool, str]:
        """
        Check database health by executing a simple query
        Returns: (is_healthy: bool, error_message: str)
        """
        try:
            with self.SessionLocal() as session:
                session.execute(text("SELECT 1"))
                session.commit()
                return True, ""
        except SQLAlchemyError as e:
            return False, str(e)
        except Exception as e:
            return False, f"Database error: {str(e)}"
        finally:
            self.SessionLocal.close_all()
        
    def get_session(self):
        session = self.SessionLocal()
        try:
            yield session
        finally:
            session.close()

    def get_all_dataset_jsonl(self, dataset_id: str):
        """Get all JSONL records for a dataset"""
        with self.SessionLocal() as session:
            result = session.execute(
                text("""
                    SELECT jsonl_content 
                    FROM dataset_output_table 
                    WHERE dataset_id = :dataset_id
                """),
                {"dataset_id": dataset_id}
            )
            return result.fetchall()

    def create_task(self, task_id: str, config_id: str, status: str = 'PREPARING') -> TaskStatus:
        """Create a new fine-tuning task"""
        session = self.SessionLocal()
        try:
            new_task = FineTuneTask(
                task_id=task_id,
                config_id=config_id,
                status=status,
                current_step='Initializing',
                progress=0.0
            )
            session.add(new_task)
            session.commit()

            return TaskStatus(
                task_id=new_task.task_id,
                status=new_task.status,
                current_step=new_task.current_step,
                progress=new_task.progress,
                error=new_task.error,
                metrics=new_task.metrics,
                result=new_task.result
            )
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    def update_task_status(
        self, 
        task_id: str, 
        status: str, 
        current_step: str = None, 
        progress: float = None, 
        error: str = None, 
        metrics: dict = None, 
        result: dict = None
    ) -> TaskStatus:
        """Update the status of a fine-tuning task"""
        session = self.SessionLocal()
        try:
            task = session.query(FineTuneTask).filter(FineTuneTask.task_id == task_id).first()
            if not task:
                raise ValueError(f"Task {task_id} not found")

            task.status = status
            if current_step is not None:
                task.current_step = current_step
            if progress is not None:
                task.progress = progress
            if error is not None:
                task.error = error
            if metrics is not None:
                task.metrics = metrics
            if result is not None:
                task.result = result
            
            session.commit()

            return TaskStatus(
                task_id=task.task_id,
                status=task.status,
                current_step=task.current_step,
                progress=task.progress,
                error=task.error,
                metrics=task.metrics,
                result=task.result
            )
        except Exception as e:
            session.rollback()
            raise e
        finally:
            session.close()

    def get_task_status(self, config_id: str) -> TaskStatus:
        """Get the status of a fine-tuning task"""
        session = self.SessionLocal()
        try:
            task = session.query(FineTuneTask)\
            .filter(FineTuneTask.config_id == config_id)\
            .order_by(FineTuneTask.created_at.desc())\
            .first()
            if not task:
                return None

            return TaskStatus(
                task_id=task.task_id,
                status=task.status,
                current_step=task.current_step,
                progress=task.progress,
                error=task.error,
                metrics=task.metrics,
                result=task.result
            )
        finally:
            session.close()
        
    def get_finetune_config(self, config_id: str):
        """Get fine-tuning configuration including processed_file_full_path"""
        session = self.SessionLocal()
        try:
            config = session.query(FineTuneConfig).filter(
                FineTuneConfig.id == config_id
            ).first()
            
            if not config:
                return None
                
            return config
        except Exception as e:
            raise e
        finally:
            session.close()

    def update_finetune_status(self, config_id: str, status: str) -> bool:
        """
        Update fine-tuning configuration status
        Args:
            config_id: The configuration ID
            status: The new status to set
        Returns:
            bool: True if update was successful
        """
        session = self.SessionLocal()
        try:
            # Query to update the status column
            result = session.execute(
                text("""
                    UPDATE finetune_master_table
                    SET status = :status,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = :config_id
                    RETURNING id
                """),
                {"status": status, "config_id": config_id}
            )
            session.commit()
            
            # Check if any row was updated
            return result.fetchone() is not None
        except SQLAlchemyError as e:
            session.rollback()
            raise e
        finally:
            session.close()

# Dependency to get database interface
def get_db():
    """Database dependency"""
    try:
        db = DatabaseInterface()
        yield db
    except Exception as e:
        raise Exception(f"Failed to create database interface: {str(e)}")
