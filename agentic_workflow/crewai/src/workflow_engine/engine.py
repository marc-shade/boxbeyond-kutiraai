# src/workflow_engine/engine.py
from typing import Optional, List, Dict, Any, Tuple
import logging
import datetime
from crewai import Agent, Crew, Task, LLM
from sqlalchemy.orm import Session
from .exceptions import (
    WorkflowEngineError, WorkflowNotFoundError,
    WorkflowMetadataError, TaskConfigurationError,
    AgentConfigurationError
)
import os
from . import crud

DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "postgres")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "workflow_db")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WorkflowMetadata:
    def __init__(self, config: Dict[str, Any]):
        if not isinstance(config, dict):
            raise WorkflowMetadataError("Configuration must be a dictionary")
            
        # Required fields validation
        required_fields = ['name', 'version']
        for field in required_fields:
            if field not in config:
                raise WorkflowMetadataError(f"Missing required field: {field}")

        self.name = config['name']
        self.description = config.get('description', '')
        self.version = config['version']
        self.author = config.get('author', '')
        self.tags = config.get('tags', [])
        self.inputs = config.get('inputs', [])
        self.outputs = config.get('outputs', [])
        self.settings = config.get('settings', {})

    def validate_inputs(self, inputs: Dict[str, Any]) -> None:
        """Validate workflow inputs against metadata"""
        if not isinstance(inputs, dict):
            raise WorkflowMetadataError("Inputs must be a dictionary")

        for input_def in self.inputs:
            if not isinstance(input_def, dict) or 'name' not in input_def:
                raise WorkflowMetadataError("Invalid input definition format")

            input_name = input_def['name']
            if input_def.get('required', False):
                if input_name not in inputs:
                    raise WorkflowMetadataError(f"Required input '{input_name}' is missing")
            
            if input_name in inputs:
                input_value = inputs[input_name]
                input_type = input_def.get('type', 'string')
                
                # Type validation
                type_validators = {
                    'string': lambda x: isinstance(x, str),
                    'boolean': lambda x: isinstance(x, bool),
                    'number': lambda x: isinstance(x, (int, float))
                }
                
                if input_type not in type_validators:
                    raise WorkflowMetadataError(f"Unsupported input type: {input_type}")
                
                if not type_validators[input_type](input_value):
                    raise WorkflowMetadataError(
                        f"Input '{input_name}' must be of type {input_type}"
                    )

class WorkflowEngine:
    def __init__(self, db: Session):
        if db is None:
            raise WorkflowEngineError("Database session cannot be None")
        
        self.db = db
        self.traces = None
        self.llm = LLM(
            api_key=os.getenv("LLM_API_KEY", "nothing"),  
            model=os.getenv("LLM_MODEL", "ollama/llava"),
            base_url=os.getenv("LLM_BASE_URL", "http://host.docker.internal:11434")
        )

    def load_workflow_configs(self, workflow_name: str) -> Tuple[Dict, Dict, Dict]:
        """Load workflow configurations from the database"""
        if not workflow_name:
            raise WorkflowEngineError("Workflow name cannot be empty")

        repo = crud.WorkflowRepository(self.db)
        workflow = repo.get_workflow_name(workflow_name)
        if not workflow:
            raise WorkflowNotFoundError(f"Workflow '{workflow_name}' not found")
        
        # set the name and description in the config object
        workflow.config['name'] = workflow.name
        workflow.config['description'] = workflow.description
        
        return workflow.config, workflow.agents, workflow.tasks

    def get_workflow_info(self, workflow_name: str) -> Dict[str, Any]:
        """Get workflow metadata information"""
        try:
            metadata, _, _ = self.load_workflow_configs(workflow_name)
            return {
                "name": metadata.name,
                "description": metadata.description,
                "version": metadata.version,
                "author": metadata.author,
                "tags": metadata.tags,
                "inputs": metadata.inputs,
                "outputs": metadata.outputs,
                "settings": metadata.settings
            }
        except WorkflowNotFoundError as e:
            raise
        except Exception as e:
            raise WorkflowEngineError(f"Error getting workflow info: {str(e)}")

    def add_trace(self, task_name: str, output: str) -> None:
        """Add a trace if tracing is enabled"""
        if self.traces is not None:
            if not task_name:
                raise TaskConfigurationError("Task name cannot be empty")
            
            self.traces.append({
                "task": task_name,
                "output": str(output),
                "timestamp": datetime.datetime.now().isoformat()
            })
    
    def create_crew(self, workflow_name: str, inputs: Dict[str, Any], 
                   traces: Optional[List] = None) -> Tuple[Crew, WorkflowMetadata]:
        """Create a crew based on workflow configuration"""
        try:
            self.traces = traces
            metadata, agents_config, tasks_config = self.load_workflow_configs(workflow_name)
            
            # Validate workflow metadata
            workflow_metadata = WorkflowMetadata(metadata)
            workflow_metadata.validate_inputs(inputs)
            
            logger.info(tasks_config)
            
            # Create agents
            agents = {}
            for agent_id, config in agents_config.items():
                if not agent_id:
                    raise AgentConfigurationError("Agent ID cannot be empty")
                
                # Add default LLM if not specified in config
                if 'llm' not in config:
                    config['llm'] = self.llm
                
                try:
                    agents[agent_id] = Agent(**config)
                except Exception as e:
                    raise AgentConfigurationError(f"Error creating agent {agent_id}: {str(e)}")
            
            # Validate tasks list is empty or not
            if tasks_config is None or len(tasks_config) == 0:
                raise TaskConfigurationError("Tasks configuration cannot be empty")
                
            # Create tasks
            tasks = []
            for task in tasks_config:
                if 'agent' not in task:
                    raise TaskConfigurationError("Task must specify an agent")
                
                agent_id = task.pop('agent')
                if agent_id not in agents:
                    raise TaskConfigurationError(f"Agent '{agent_id}' not found")
                
                # Add callback if tracing is enabled
                if self.traces is not None:
                    task['callback'] = lambda output, task_name=task['name']: \
                        self.add_trace(task_name, output)
                
                # Create task
                task['agent'] = agents[agent_id]
                try:
                    tasks.append(Task(**task))
                except Exception as e:
                    raise TaskConfigurationError(f"Error creating task: {str(e)}")
            
            # Set default crew configuration
            crew_config = {
                'agents': list(agents.values()),
                'tasks': tasks,
                'verbose': True,
                'process': 'sequential',
                'max_iterations': 1,
                'task_timeout': 600
            }
        
            # Merge with user-provided crew configuration and workflow settings
            crew_config.update(workflow_metadata.settings)
            
            # Create crew
            try:
                crew = Crew(**crew_config)
            except Exception as e:
                raise WorkflowEngineError(f"Error creating crew: {str(e)}")
            
            logger.info(f"Successfully created crew for workflow: {workflow_name}")
            return crew, workflow_metadata
            
        except (WorkflowNotFoundError, WorkflowMetadataError, 
                AgentConfigurationError, TaskConfigurationError) as e:
            logger.error(str(e))
            raise
        except Exception as e:
            logger.error(f"Unexpected error creating crew: {str(e)}", exc_info=True)
            raise WorkflowEngineError(f"Error creating crew: {str(e)}")