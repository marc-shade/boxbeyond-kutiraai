import subprocess
from typing import Tuple
import os, sys

def construct_shell_command(command: list[str]) -> str:
    
    return str(command).replace("'","").replace("[","").replace("]","").replace(",","")

def run_command_with_live_output(command: list[str]) -> Tuple[str, str]:
    """
    Runs a command and captures its output.

    Args:
        command (List[str]): The command and its arguments to be executed.

    Returns:
        Tuple[str, str]: A tuple containing the stdout and stderr output.
    """
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    stdout_output = []
    stderr_output = []

    # Capture the output line by line
    while True:
        stdout_line = process.stdout.readline()
        stderr_line = process.stderr.readline()
        
        if stdout_line:
            print(stdout_line.strip())
            stdout_output.append(stdout_line)
        if stderr_line:
            print(stderr_line.strip(), file=sys.stderr)
            stderr_output.append(stderr_line)
        
        if process.poll() is not None:
            break
    
    return_code = process.returncode
    stdout = ''.join(stdout_output)
    stderr = ''.join(stderr_output)
        
    return return_code, stdout, stderr

def execute_ollama_create(model_name: str, modelfile_path: str) -> Tuple[int, str, str]:
    """
    Executes the Ollama create command and returns the result.

    Args:
        model_name (str): The name of the model to create.
        modelfile_path (str): The path to the Modelfile.

    Returns:
        Tuple[int, str, str]: A tuple containing the return code, stdout, and stderr.
    """
    command = ['ollama', 'create', model_name, '-f', modelfile_path]
    
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        return 0, result.stdout, result.stderr
    except subprocess.CalledProcessError as e:
        return e.returncode, e.stdout, e.stderr

def create_modelfile(base_model, adapter_path, modelfile_location):
    modelfile_path = os.path.join(modelfile_location, 'Modelfile')
    stdout = []
    stderr = []

    # Create the directory if it doesn't exist
    try:
        os.makedirs(modelfile_location, exist_ok=True)
        stdout.append(f"Directory created or already exists: {modelfile_location}")
    except Exception as e:
        stderr.append(f"Error creating directory: {str(e)}")
        return "\n".join(stdout), "\n".join(stderr)

    modelfile_content = f"""FROM {base_model}
ADAPTER {adapter_path}
"""

    try:
        # Open the file in write mode, which will overwrite if it exists
        with open(modelfile_path, 'w') as f:
            f.write(modelfile_content)
        
        if os.path.exists(modelfile_path):
            stdout.append(f"Modelfile overwritten at {modelfile_path}")
        else:
            stdout.append(f"Modelfile created at {modelfile_path}")
            
        return 0, stdout, stderr
    except IOError as e:
        stderr.append(f"Error creating/overwriting Modelfile: {str(e)}")
        return -1, stdout, stderr


def execute_help_command() -> Tuple[str, str]:
    """
    Executes the help command for scripts/lora.py and returns its output.

    Returns:
        Tuple[str, str]: A tuple containing the stdout and stderr output.
    """
    command = ['python', 'mlx_lm_files/lora.py', '--help']
    stdout, stderr = run_command_with_live_output(command)
    return stdout, stderr

def execute_fine_tuning_command(model_name: str, num_iters: str, 
                                steps_per_eval: str, num_layers: str,
                                learning_rate: str, val_batches: str,
                                adapter_path: str, input_data_path:str) -> Tuple[str, str]:
    """
    Executes the fine tune command using lora script

    Returns:
        Tuple[str, str]: A tuple containing the stdout and stderr output.
    """
    
    # Define your command
    command = ['python', 'mlx_lm_files/lora.py', '--model', model_name, '--train', '--iters', num_iters, '--steps-per-eval', steps_per_eval, '--val-batches', val_batches,
        '--learning-rate', learning_rate, '--lora-layers', num_layers, '--test', '--data',
        input_data_path, '--adapter-file', adapter_path]
    
    returncode, stdout, stderr = run_command_with_live_output(command)
    return returncode, stdout, stderr


def execute_fuse_command(model_name: str, adapter_path: str, output_path: str) -> Tuple[str, str]:
    
    # now fuse the model with original with dequantize
    command = [
        'python', 'mlx_lm_files/fuse.py',
        '--model', model_name,
        '--adapter-file', adapter_path,
        '--save-path', output_path,
        '-d'
    ]
    
    returncode, stdout, stderr = run_command_with_live_output(command)
    
    return returncode, stdout, stderr

def execute_convert_command(output_path: str, output_model_name:str) -> Tuple[str, str]:
    
    # convert the fused model to GGUF format
    command = [
        'python', 'llama.cpp/convert_hf_to_gguf.py',
        output_path,
        '--outfile', output_path + '/' +  output_model_name + '.gguf',
        '--outtype', 'q8_0'
    ]
    
    returncode, stdout, stderr = run_command_with_live_output(command)
    
    return returncode, stdout, stderr

def execute_modelfile_command(model_owner: str, output_path: str, output_final_model_name: str)-> Tuple[str, str]:
    
    # create the Modelfile for Ollama
    returncode, stdout, stderr = create_modelfile(model_owner, output_path + "/" + output_final_model_name + '.gguf', output_path)
    
    return returncode, stdout, stderr
    

def execute_ollama_create_command(output_model_name: str, output_path: str) -> Tuple[str, str]:
    # create the Ollama model
    return_code, stdout, stderr = execute_ollama_create(output_model_name, output_path + "/Modelfile")
    
    if return_code == 0:
        stdout = f"Model '{output_model_name}' created successfully."
    else:
        stderr = f"Error creating model '{output_model_name}'. Return code: {return_code}"
    
    return return_code, stdout, stderr