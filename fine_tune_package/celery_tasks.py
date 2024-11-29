from celery import Celery
import time
import requests
from requests.exceptions import HTTPError
import psycopg2

celery_instance = Celery('celery_tasks')
celery_instance.conf.broker_url = 'redis://localhost:6379/0'
celery_instance.conf.result_backend = 'redis://localhost:6379/0'
celery_instance.conf.DB_USERNAME='root',
celery_instance.conf.DB_PASSWORD='password'

@celery_instance.task(name="create_task")
def create_task(task_type):
    time.sleep(int(task_type) * 10)  # Simulate a time-consuming task
    return f"Task of type {task_type} completed"

@celery_instance.task(name="invoke_dataset_generator")
def invoke_dataset_generator(dataset_id, filepath, systemPrompt, modelTemplate):
    # trigger the workflow
    n8n_webhook_url = 'http://localhost:5678/webhook/304a31a4-99b0-473a-b439-7e349eb64d9a'
    
    try:
        response = requests.post(n8n_webhook_url, json={
            "dataset_id": dataset_id,
            "filepath": filepath,
            'systemPrompt': systemPrompt,
            'modelTemplate': modelTemplate  
        })
        response.raise_for_status()  # Raises an HTTPError for bad responses
        
        update_dataset_status(dataset_id, "Completed")
    except HTTPError as http_err:
        error_code = http_err.response.status_code
        update_dataset_status(dataset_id, "Error")
        
def get_db_connection():
    return psycopg2.connect(
        user='root',
        password='password',
        host='localhost',
        database='rooot'
    )

def update_dataset_status(id, status):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute('UPDATE dataset_master_table SET dataset_status = %s WHERE id = %s;', (status, id))
        conn.commit()
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()