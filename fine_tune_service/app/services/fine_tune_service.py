# app/services/fine_tune_service.py
import subprocess
import os
import json
from typing import Tuple, Dict
import logging
from pathlib import Path
logger = logging.getLogger(__name__)

class FineTuneService:
    def __init__(self, base_path: str):
        """
        Initialize FineTuneService with base path
        
        Args:
            base_path: Base path will be working directory
        """
        self.base_path = base_path

    def construct_shell_command(self, command: list[str]) -> str:
        """Convert command list to string for logging"""
        return str(command).replace("'","").replace("[","").replace("]","").replace(",","")

    def run_command_with_live_output(self, command: list[str]) -> Tuple[int, str, str]:
        """
        Runs a command and captures its output with live streaming.
        
        Args:
            command (List[str]): The command and its arguments to be executed.
            
        Returns:
            Tuple[int, str, str]: A tuple containing return code, stdout, and stderr.
        """
        logger.info(f"Executing command: {self.construct_shell_command(command)}")
        
        process = subprocess.Popen(
            command, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            text=True,
            cwd=self.base_path  # Set working directory to base_path
        )
        
        stdout_output = []
        stderr_output = []

        while True:
            stdout_line = process.stdout.readline()
            stderr_line = process.stderr.readline()
            
            if stdout_line:
                logger.info(stdout_line.strip())
                stdout_output.append(stdout_line)
            if stderr_line:
                logger.error(stderr_line.strip())
                stderr_output.append(stderr_line)
            
            if process.poll() is not None:
                break
        
        return_code = process.returncode
        stdout = ''.join(stdout_output)
        stderr = ''.join(stderr_output)
        
        logger.error(f"Command execution completed with return code: {return_code}")
        logger.error(f"Stderr output: {stderr}")
        
        return return_code, stdout, stderr
    
    def login_to_huggingface(self, token: str) -> Tuple[int, str, str]:
        """Login to Hugging Face using the huggingface-cli"""
        command = ['huggingface-cli', 'login', '--token', token]
        return self.run_command_with_live_output(command)

    def execute_fine_tuning(self, config: Dict) -> Tuple[int, str, str]:
        """Execute the fine-tuning command using mlx_lm"""
        command = ["mlx_lm.lora", 
                   '--model', str(config.base_model),
                   '--train', 
                   '--iters', "100", #str(config.num_iterations),
                   '--steps-per-eval', str(config.steps_per_eval),
                   '--batch-size', str(config.batch_size),
                   '--learning-rate', str(config.learning_rate),
                   '--num-layers', str(config.num_layers),
                   '--test', 
                   '--data', config.processed_file_full_path, 
                   '--adapter-path', os.path.join(config.processed_file_full_path, "adapters")
        ]
        
        return self.run_command_with_live_output(command)

    def create_modelfile(self, model_owner: str, adapter_path: str, modelfile_location: str) -> Tuple[int, str, str]:
        """Create the Modelfile for Ollama"""
        modelfile_path = os.path.join(modelfile_location, 'Modelfile')
        stdout = []
        stderr = []

        try:
            os.makedirs(modelfile_location, exist_ok=True)
            stdout.append(f"Directory created or already exists: {modelfile_location}")
            
            modelfile_content = f"""FROM {model_owner}
ADAPTER {adapter_path}
"""
            with open(modelfile_path, 'w') as f:
                f.write(modelfile_content)
            
            stdout.append(f"Modelfile created at {modelfile_path}")
            return 0, '\n'.join(stdout), '\n'.join(stderr)
            
        except Exception as e:
            stderr.append(f"Error creating Modelfile: {str(e)}")
            return -1, '\n'.join(stdout), '\n'.join(stderr)

    def execute_ollama_create(self, model_name: str, modelfile_path: str) -> Tuple[int, str, str]:
        """Execute the Ollama create command"""
        command = ['ollama', 'create', model_name, '-f', modelfile_path]
        return self.run_command_with_live_output(command)
