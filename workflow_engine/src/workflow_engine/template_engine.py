# src/workflow_engine/template_engine.py
import re
from typing import Dict, Any, Union
from .exceptions import WorkflowEngineError

class TemplateEngine:
    """Template engine for parameter substitution in workflow configurations"""
    
    def __init__(self):
        # Pattern to match {parameter_name} placeholders
        self.pattern = re.compile(r'\{([^}]+)\}')
    
    def substitute_parameters(self, template: Union[str, Dict, Any], inputs: Dict[str, Any]) -> Union[str, Dict, Any]:
        """
        Recursively substitute parameters in templates
        
        Args:
            template: The template string, dict, or other value to process
            inputs: Dictionary of input parameters and their values
            
        Returns:
            The template with parameters substituted
        """
        if isinstance(template, str):
            return self._substitute_string(template, inputs)
        elif isinstance(template, dict):
            return self._substitute_dict(template, inputs)
        elif isinstance(template, list):
            return self._substitute_list(template, inputs)
        else:
            # Return as-is for other types (int, bool, etc.)
            return template
    
    def _substitute_string(self, template: str, inputs: Dict[str, Any]) -> str:
        """Substitute parameters in a string template"""
        def replace_match(match):
            param_name = match.group(1).strip()
            if param_name in inputs:
                value = inputs[param_name]
                # Convert non-string values to strings
                return str(value) if value is not None else ""
            else:
                # Keep the placeholder if parameter not found
                return match.group(0)
        
        return self.pattern.sub(replace_match, template)
    
    def _substitute_dict(self, template: Dict, inputs: Dict[str, Any]) -> Dict:
        """Substitute parameters in a dictionary template"""
        result = {}
        for key, value in template.items():
            # Substitute in both keys and values
            new_key = self.substitute_parameters(key, inputs)
            new_value = self.substitute_parameters(value, inputs)
            result[new_key] = new_value
        return result
    
    def _substitute_list(self, template: list, inputs: Dict[str, Any]) -> list:
        """Substitute parameters in a list template"""
        return [self.substitute_parameters(item, inputs) for item in template]
    
    def extract_parameters(self, template: Union[str, Dict, Any]) -> set:
        """
        Extract all parameter names from a template
        
        Args:
            template: The template to analyze
            
        Returns:
            Set of parameter names found in the template
        """
        parameters = set()
        
        if isinstance(template, str):
            matches = self.pattern.findall(template)
            parameters.update(param.strip() for param in matches)
        elif isinstance(template, dict):
            for key, value in template.items():
                parameters.update(self.extract_parameters(key))
                parameters.update(self.extract_parameters(value))
        elif isinstance(template, list):
            for item in template:
                parameters.update(self.extract_parameters(item))
        
        return parameters
    
    def validate_parameters(self, template: Union[str, Dict, Any], available_inputs: Dict[str, Any]) -> list:
        """
        Validate that all parameters in template have corresponding inputs
        
        Args:
            template: The template to validate
            available_inputs: Dictionary of available input parameters
            
        Returns:
            List of missing parameter names
        """
        required_params = self.extract_parameters(template)
        missing_params = []
        
        for param in required_params:
            if param not in available_inputs:
                missing_params.append(param)
        
        return missing_params
