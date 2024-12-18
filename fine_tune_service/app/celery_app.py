# app/celery_app.py
from celery import Celery
from .database import DatabaseInterface
from .services.fine_tune_service import FineTuneService
import os
import logging

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
        return_code, stdout, stderr = fine_tune_service.login_to_huggingface(token="HUGGINGFACE_API_TOKEN_PLACEHOLDER")
        if return_code != 0:
            raise Exception(f"Huggingface login failed: {stderr}")
    
        # Step 3: Begin fine tuning process
        db.update_task_status(
            task_id=task_id,
            status='FINETUNING',
            progress=50,
            current_step='Starting fine-tuning'
        )
        return_code, stdout, stderr = fine_tune_service.execute_fine_tuning(config=finetune_config)
        if return_code != 0:
            raise Exception(f"Fine-tuning failed: {stderr}")

        # Step 4: Create Modelfile
        db.update_task_status(
            task_id=task_id,
            status='CREATING_MODEL',
            progress=90,
            current_step='Creating Modelfile'
        )
        
        return_code, stdout, stderr = fine_tune_service.create_modelfile(
            finetune_config.model_type,
            f"{output_dir}/adapters",
            output_dir
        )
        if return_code != 0:
            raise Exception(f"Modelfile creation failed: {stderr}")
        
        # Step 5: Import into Ollama
        db.update_task_status(
            task_id=task_id,
            status='OLLAMA_IMPORT',
            progress=99,
            current_step='Importing into Ollama'
        )

        # Step 5: Create Ollama model
        return_code, stdout, stderr = fine_tune_service.execute_ollama_create(
            finetune_config.finetuned_model_name,
            os.path.join(output_dir, 'Modelfile')
        )
        if return_code != 0:
            raise Exception(f"Ollama model creation failed: {stderr}")

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
        db.update_task_status(
            task_id=task_id,
            status='FAILED',
            error=str(e),
            progress=0
        )
        
        # update the master table status
        db.update_finetune_status(config_id, "Failed")
        raise e
