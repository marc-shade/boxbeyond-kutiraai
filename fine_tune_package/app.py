from flask import Flask, request, jsonify
import os
import fine_tune
from pydantic import BaseModel, Field
from typing import Optional
from flask_cors import CORS
from celery_tasks import create_task, celery_instance, invoke_dataset_generator
from celery.result import AsyncResult
import database_intf
import util_functions


# Set environment variables if HF token is provided
os.environ['HF_TOKEN'] = "HUGGINGFACE_API_TOKEN_PLACEHOLDER"
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'
os.environ['DB_USERNAME'] = 'root'
os.environ['DB_PASSWORD'] = 'password'

class Settings(BaseModel):
    num_iterations: str
    steps_per_eval: str
    num_layers: str
    learning_rate: str
    batch_size: str
    finetuned_model_name: str
    processed_file_full_path: str

class FormData(BaseModel):
    selectedModel: str
    dataset_id: str
    selectedSlug: str
    selectedOwner: str
    test_percent: str
    validation_percent: str
    settings: Settings

class FineTuneParams(BaseModel):
    formData: FormData

app = Flask(__name__)
CORS(app)

def process_data(data):
    # Process the data here
    return data

@app.route('/', methods=['GET'])
def hello():
    return "Rooot is running!!"

@app.route('/dataset', methods=['GET'])
def get_datasets():
    collection = database_intf.get_dataset()
    return jsonify({"data": collection})

@app.route('/dataset', methods=['POST', 'OPTIONS'])
def insert_dataset():
    if request.method == 'OPTIONS':
        # Respond to preflight request
        return '', 204
    # insert in the database
    insert_id = database_intf.insert_dataset(request.json['formData'])
    # get the model template
    model_template = database_intf.get_dataset_template_by_id(request.json['formData']['promptTemplate'])
    # delegate to the celery task
    task = invoke_dataset_generator.delay(insert_id, request.json['formData']['inputLocation'], request.json['formData']['systemPrompt'], model_template['model_template'])
    # delegate the job to celery
    return jsonify({"message": "Dataset inserted successfully.", "task_id": task.id}), 202

@app.route('/dataset/<id>', methods=['GET'])
def get_dataset(id):
    collection = database_intf.get_dataset_by_id(id)
    return jsonify({"data": collection})

@app.route('/dataset-templates', methods=['GET'])
def get_dataset_templates():
    collection = database_intf.get_dataset_templates()
    return jsonify({"data": collection})

@app.route('/dataset-templates/<id>', methods=['GET'])
def get_dataset_template_by_id(id):
    collection = database_intf.get_dataset_template_by_id(id)
    return jsonify({"data": collection})

@app.route('/dataset-templates', methods=['POST', 'OPTIONS'])
def upsert_dataset_template():
    # print the request object
    print(request.json['currentModel'])
    
    if request.method == 'OPTIONS':
        # Respond to preflight request
        return '', 204

    database_intf.upsert_dataset_template(request.json['currentModel'])
    return jsonify({"message": "Dataset template upserted successfully."})    

@app.route('/configuration', methods=['GET'])
def get_configurations():
    collection = database_intf.get_configuration()
    return jsonify({"data": collection})

@app.route('/configuration/<id>', methods=['GET'])
def get_configuration_by_id(id):
    collection = database_intf.get_configuration_by_id(id)
    return jsonify({"data": collection})

@app.route('/configuration', methods=['POST', 'OPTIONS'])
def upsert_configuration():
    if request.method == 'OPTIONS':
        # Respond to preflight request
        return '', 204
    database_intf.upsert_configuration(request.json['configuration'])
    return jsonify({"message": "Configuration upserted successfully."})

@app.route('/configuration/<int:id>', methods=['DELETE'])
def delete_configuration(id):
    # get the id from the request
    database_intf.delete_configuration(id)
    return jsonify({"message": "Configuration deleted successfully."})

@app.route('/start-task', methods=['POST'])
def start_task():
    task_type = request.json.get('task_type')
    task = create_task.delay(task_type)
    return jsonify({"task_id": task.id}), 202

@app.route('/task-status/<task_id>', methods=['GET'])
def get_task_result(task_id):
    task_result = AsyncResult(task_id, app=celery_instance)
    return jsonify({"status": task_result.state})

@app.route('/finetune', methods=['POST', 'OPTIONS'])
def finetune():
    if request.method == 'OPTIONS':
        # Respond to preflight request
        return '', 204
    # Parse the JSON payload into a FineTuneParams object
    params = FineTuneParams(**request.json)
    # clear the folders if any
    util_functions.delete_all(params.formData.settings.processed_file_full_path)
    # create the folders
    util_functions.create_folder(params.formData.settings.processed_file_full_path + "/_data")
    util_functions.create_folder(params.formData.settings.processed_file_full_path + "/adapter")
    util_functions.create_folder(params.formData.settings.processed_file_full_path + "/output")
    # prepare the dataset for finetuning
    generate_dataset_files(params.formData.dataset_id, int(params.formData.test_percent), int(params.formData.validation_percent), 
                           params.formData.settings.processed_file_full_path + "/_data")
    # execute the finetune command
    return_code, stdout, stderr = fine_tune.execute_fine_tuning_command(
        model_name=params.formData.selectedModel, num_iters=params.formData.settings.num_iterations, steps_per_eval=params.formData.settings.steps_per_eval, 
        num_layers=params.formData.settings.num_layers, learning_rate=params.formData.settings.learning_rate,
        val_batches=params.formData.settings.batch_size, adapter_path=params.formData.settings.processed_file_full_path + "/adapter/adapter.npz", 
        input_data_path=params.formData.settings.processed_file_full_path + "/_data")
    
    print(return_code, stdout, stderr)
    # print the formData
    print(params.formData)
    # return the stdoout and std err as json
    return {"code": return_code, "stdout": stdout, "stderr": stderr}

@app.route('/fuse', methods=['POST', 'OPTIONS'])
def fuse():
    if request.method == 'OPTIONS':
        # Respond to preflight request
        return '', 204
    # Parse the JSON payload into a FineTuneParams object
    params = FineTuneParams(**request.json)
    # execute the finetune command
    return_code, stdout, stderr = fine_tune.execute_fuse_command(
        model_name=params.formData.selectedModel, adapter_path=params.formData.settings.processed_file_full_path + "/adapter/adapter.npz",
        output_path=params.formData.settings.processed_file_full_path + "/output")
    
    print(return_code, stdout, stderr)
    # return the stdoout and std err as json
    return {"code": return_code, "stdout": stdout, "stderr": stderr}

@app.route('/convert', methods=['POST', 'OPTIONS'])
def convert():
    if request.method == 'OPTIONS':
        # Respond to preflight request
        return '', 204
    # Parse the JSON payload into a FineTuneParams object
    params = FineTuneParams(**request.json)
    # execute the finetune command
    return_code, stdout, stderr = fine_tune.execute_convert_command(
        params.formData.settings.processed_file_full_path + "/output", params.formData.settings.finetuned_model_name)
    print(stdout, stderr)
    # return the stdoout and std err as json
    return {"code": return_code, "stdout": stdout, "stderr": stderr}

@app.route('/modelfile', methods=['POST', 'OPTIONS'])
def modelfile():
    if request.method == 'OPTIONS':
        # Respond to preflight request
        return '', 204
    # Parse the JSON payload into a FineTuneParams object
    params = FineTuneParams(**request.json)
    # execute the finetune command
    return_code, stdout, stderr = fine_tune.execute_modelfile_command(
        params.formData.selectedOwner, params.formData.settings.processed_file_full_path + "/output", params.formData.settings.finetuned_model_name)
    print(stdout, stderr)
    # return the stdoout and std err as json
    return {"code": return_code, "stdout": stdout, "stderr": stderr}

@app.route('/create', methods=['POST', 'OPTIONS'])
def create():
    if request.method == 'OPTIONS':
        # Respond to preflight request
        return '', 204
    # Parse the JSON payload into a FineTuneParams object
    params = FineTuneParams(**request.json)
    # execute the finetune command
    return_code, stdout, stderr = fine_tune.execute_ollama_create_command(
        params.formData.settings.finetuned_model_name, params.formData.settings.processed_file_full_path + "/output")
    print(stdout, stderr)
    # return the stdoout and std err as json
    return {"code": return_code, "stdout": stdout, "stderr": stderr}


def generate_dataset_files(id, test_percent, valid_percent, output_location):
    rows = database_intf.get_all_dataset_jsonl(id)
    
    util_functions.create_data_files(rows, test_percent, valid_percent, output_location)
    
    return
    
            
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9000, debug=True)
   