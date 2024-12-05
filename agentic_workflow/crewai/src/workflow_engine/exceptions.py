# src/workflow_engine/exceptions.py
from typing import Optional, Dict, Any

class WorkflowEngineError(Exception):
    """Base exception class for workflow engine errors"""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)

class WorkflowNotFoundError(WorkflowEngineError):
    """Raised when a requested workflow cannot be found"""
    def __init__(self, workflow_name: str):
        super().__init__(
            message=f"Workflow '{workflow_name}' not found",
            details={"workflow_name": workflow_name}
        )

class ConfigurationError(WorkflowEngineError):
    """Raised when there are issues with workflow configuration"""
    def __init__(self, message: str, config_file: Optional[str] = None, config_key: Optional[str] = None):
        details = {}
        if config_file:
            details["config_file"] = config_file
        if config_key:
            details["config_key"] = config_key
        super().__init__(message=message, details=details)

class ValidationError(WorkflowEngineError):
    """Raised when workflow input validation fails"""
    def __init__(self, message: str, input_name: Optional[str] = None, expected_type: Optional[str] = None, received_value: Any = None):
        details = {}
        if input_name:
            details["input_name"] = input_name
        if expected_type:
            details["expected_type"] = expected_type
        if received_value is not None:
            details["received_value"] = str(received_value)
        super().__init__(message=message, details=details)

class WorkflowExecutionError(WorkflowEngineError):
    """Raised when there's an error during workflow execution"""
    def __init__(self, message: str, workflow_name: str, task_name: Optional[str] = None, agent_name: Optional[str] = None):
        details = {
            "workflow_name": workflow_name,
            "task_name": task_name,
            "agent_name": agent_name
        }
        super().__init__(message=message, details=details)

class AgentConfigurationError(ConfigurationError):
    """Raised when there's an issue with agent configuration"""
    def __init__(self, message: str, agent_id: str, config_key: Optional[str] = None):
        super().__init__(
            message=message,
            config_file="agents.yaml",
            config_key=f"agents.{agent_id}" + (f".{config_key}" if config_key else "")
        )

class TaskConfigurationError(ConfigurationError):
    """Raised when there's an issue with task configuration"""
    def __init__(self, message: str, task_name: str, config_key: Optional[str] = None):
        super().__init__(
            message=message,
            config_file="tasks.yaml",
            config_key=f"tasks.{task_name}" + (f".{config_key}" if config_key else "")
        )

class WorkflowMetadataError(ConfigurationError):
    """Raised when there's an issue with workflow metadata"""
    def __init__(self, message: str, config_key: Optional[str] = None):
        super().__init__(
            message=message,
            config_file="config.yaml",
            config_key=config_key
        )

class LLMConfigurationError(WorkflowEngineError):
    """Raised when there's an issue with LLM configuration"""
    def __init__(self, message: str, provider: Optional[str] = None, model: Optional[str] = None):
        details = {}
        if provider:
            details["provider"] = provider
        if model:
            details["model"] = model
        super().__init__(message=message, details=details)

class ResourceNotAvailableError(WorkflowEngineError):
    """Raised when a required resource is not available"""
    def __init__(self, resource_type: str, resource_name: str, message: Optional[str] = None):
        super().__init__(
            message=message or f"{resource_type} '{resource_name}' is not available",
            details={
                "resource_type": resource_type,
                "resource_name": resource_name
            }
        )

class TimeoutError(WorkflowEngineError):
    """Raised when a workflow or task execution times out"""
    def __init__(self, workflow_name: str, task_name: Optional[str] = None, timeout_seconds: int = 0):
        details = {
            "workflow_name": workflow_name,
            "timeout_seconds": timeout_seconds
        }
        if task_name:
            details["task_name"] = task_name
        
        message = f"Execution timed out after {timeout_seconds} seconds"
        if task_name:
            message = f"Task '{task_name}' in workflow '{workflow_name}' {message}"
        else:
            message = f"Workflow '{workflow_name}' {message}"
            
        super().__init__(message=message, details=details)
