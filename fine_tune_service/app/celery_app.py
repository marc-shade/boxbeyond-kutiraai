# app/celery_app.py
from celery import Celery
from .database import DatabaseInterface
from .services.fine_tune_service import FineTuneService
import os
import logging
from dotenv import load_dotenv

# Load environment variables from parent directory
load_dotenv(dotenv_path="../.env")

logger = logging.getLogger(__name__)

celery_app = Celery(
    'finetune_tasks',
    broker=os.getenv('REDIS_URL', 'redis://localhost:6379/0')
)

# Add this configuration
celery_app.conf.broker_connection_retry_on_startup = True

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)

@celery_app.task(bind=True)
def run_fine_tuning_pipeline(self, config_id):
    """
    Celery task to run the complete fine-tuning pipeline
    """
    # Log the configuration
    logger.info(f"Starting fine-tuning with config: {config_id}")
    logger.info(f"Current working directory: {os.getcwd()}")
    logger.info(f"Files in current directory: {os.listdir('.')}")
    
    task_id = self.request.id
    db = DatabaseInterface()

    try:
        # Create initial task record (only place where we create the record)
        db.create_task(
            task_id=task_id,
            config_id=config_id,
            status='PREPARING'
        )

        # Get finetune configuration to get the output directory
        finetune_config = db.get_finetune_config(config_id)
        if not finetune_config:
            raise Exception(f"No configuration found for ID {config_id}")

        output_dir = finetune_config.processed_file_full_path
        if not output_dir:
            raise Exception("processed_file_full_path is not set in configuration")

        # create an instance of fine tune service
        fine_tune_service = FineTuneService(base_path=output_dir)
        
        # update the status of the fine tune task to In-Progress
        success = db.update_finetune_status(config_id, "In Progress")
        if not success:
            raise ValueError(f"No configuration found with id: {config_id}")
        
         # Step 1: Create dataset
        db.update_task_status(
            task_id=task_id,
            status='DATASET_CREATION',
            progress=20,
            current_step='Creating the JSONL files for fine tuning'
        )
        
        # Get dataset records
        rows = db.get_all_dataset_jsonl(finetune_config.dataset_id)
        if not rows:
            raise Exception(f"No records found for dataset {finetune_config.dataset_id}")

        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)

        # Prepare data files
        from .utils import create_data_files
        files = create_data_files(
            rows,
            finetune_config.test_split,
            finetune_config.validation_split,
            output_dir
        )

        # Update progress and include file paths in the status
        db.update_task_status(
            task_id=task_id,
            status='DATASET_COMPLETE',
            progress=40,
            current_step='Dataset creation completed',
            metrics={
                'file_paths': files,
                'dataset_stats': {
                    'total_records': len(rows),
                    'train_split': finetune_config.train_split,
                    'validation_split': finetune_config.validation_split,
                    'test_split': finetune_config.test_split
                }
            }
        )
        
        # Step 2: Login to Hugging Face
        db.update_task_status(
            task_id=task_id,
            status='HF_LOGIN',
            progress=40,
            current_step='Logging in to Hugging Face'
        )
        # Get Hugging Face token from environment
        hf_token = os.getenv("HUGGINGFACE_API_TOKEN")
        if not hf_token:
            raise Exception("HUGGINGFACE_API_TOKEN environment variable is required")

        return_code, stdout, stderr = fine_tune_service.login_to_huggingface(token=hf_token)
        if return_code != 0:
            raise Exception(f"Huggingface login failed: {stderr}")
    
        # Step 3: Begin fine tuning process
        db.update_task_status(
            task_id=task_id,
            status='FINETUNING',
            progress=50,
            current_step='Starting fine-tuning'
        )

        # Create progress callback to update database in real-time
        def progress_callback(progress: float, step_description: str):
            logger.info(f"Progress update: {progress}% - {step_description}")
            if progress is not None:
                db.update_task_status(
                    task_id=task_id,
                    status='FINETUNING',
                    progress=progress,
                    current_step=step_description
                )
            else:
                db.update_task_status(
                    task_id=task_id,
                    status='FINETUNING',
                    current_step=step_description
                )

        # Save the original base model for Ollama use
        original_base_model = finetune_config.base_model

        # Use whatever model is in the database - no conversion
        logger.info(f"Using model from database: {finetune_config.base_model}")
        logger.info(f"Model type: {finetune_config.model_type}")

        logger.info(f"Starting MLX fine-tuning with model: {finetune_config.base_model}")
        return_code, stdout, stderr = fine_tune_service.execute_fine_tuning(
            config=finetune_config,
            progress_callback=progress_callback
        )

        logger.info(f"MLX fine-tuning completed with return code: {return_code}")
        if return_code != 0:
            # Create a more informative error message
            error_msg = f"Fine-tuning failed with return code {return_code}"
            if stderr:
                # Extract meaningful error information
                error_lines = [line.strip() for line in stderr.split('\n') if line.strip()]
                # Look for actual error messages, not just progress output
                actual_errors = [line for line in error_lines if any(indicator in line for indicator in
                    ['Error:', 'Exception:', 'Failed', 'Cannot', 'RuntimeError', 'ValueError'])]

                if actual_errors:
                    error_msg += f": {'; '.join(actual_errors[-3:])}"  # Last 3 error lines
                elif "Traceback" in stderr:
                    error_msg += ": Python exception occurred (check logs for details)"
                else:
                    error_msg += f": {stderr[-500:]}"  # Last 500 chars of stderr

            raise Exception(error_msg)
        else:
            logger.info("MLX fine-tuning completed successfully, proceeding to model creation")

        # Step 4: Create Ollama-compatible model
        db.update_task_status(
            task_id=task_id,
            status='CREATING_MODEL',
            progress=90,
            current_step='Creating Ollama-compatible model'
        )

        return_code, stdout, stderr = fine_tune_service.create_ollama_compatible_model(
            finetune_config.model_type,
            f"{output_dir}/adapters",
            output_dir,
            finetune_config.finetuned_model_name,
            original_base_model  # Pass the original base model for Ollama
        )
        if return_code != 0:
            raise Exception(f"Ollama-compatible model creation failed: {stderr}")

        # Update final status
        db.update_task_status(
            task_id=task_id,
            status='COMPLETED',
            progress=100,
            current_step='Fine-tuning completed',
            result={
                'model_path': output_dir,
                'model_name': finetune_config.base_model,
                'stdout': stdout
            }
        )
        
        # update the master table status
        db.update_finetune_status(config_id, "Completed")

        return {
            'status': 'COMPLETED',
            'progress': 100,
            'result': {
                'model_path': output_dir,
                'model_name': finetune_config.base_model
            }
        }

    except Exception as e:
        # Get current task status to preserve progress if available
        try:
            current_task = db.get_task_status(config_id)
            current_progress = current_task.progress if current_task else 0
            current_step = current_task.current_step if current_task else "Unknown step"
        except:
            current_progress = 0
            current_step = "Unknown step"

        # Create a comprehensive error message
        error_message = f"Failed at '{current_step}': {str(e)}"

        db.update_task_status(
            task_id=task_id,
            status='FAILED',
            error=error_message,
            progress=current_progress,  # Keep the progress where it failed
            current_step=f"Failed: {current_step}"
        )

        # update the master table status
        db.update_finetune_status(config_id, "Failed")

        # Log the full error for debugging
        logger.error(f"Fine-tuning pipeline failed for config {config_id}: {str(e)}")
        logger.error(f"Full traceback: ", exc_info=True)

        raise e
