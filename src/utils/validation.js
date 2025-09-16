// src/utils/validation.js
export const validateModelName = (name) => {
    if (!name) return false;

    // Model name requirements:
    // - Must be between 3 and 15 characters
    // - Can only contain lowercase letters, numbers, and hyphens
    // - Must start with a letter
    // - Cannot end with a hyphen
    const modelNameRegex = /^[a-zA-Z0-9_]+$/;
    return modelNameRegex.test(name);
  };

  export const validateDirectory = (path) => {
    if (!path) return false;

    // Directory requirements:
    // - Must be an absolute path
    // - Cannot contain spaces or special characters except / and -
    // - Must start with /
    const directoryRegex = /^\/[a-zA-Z0-9/-]+$/;
    return directoryRegex.test(path);
  };

  // Determine model type based on model information
  export const determineModelType = (model) => {
    if (!model) return 'custom';

    // First check the actual model_type from the config if available
    if (model.config && model.config.model_type) {
      const configModelType = model.config.model_type.toLowerCase();

      // Map HuggingFace model_type to our internal types
      if (configModelType === 'llama') {
        return 'llama';  // Use actual model type from config
      }
      if (configModelType === 'mistral') {
        return 'mistral';
      }

      // Return the actual model type for other cases
      return configModelType;
    }

    const modelId = model.id || '';
    const modelName = modelId.toLowerCase();
    const tags = model.tags || [];
    const pipelineTag = model.pipeline_tag || '';

    // Check for LLaMA models (fallback if no config)
    if (modelName.includes('llama') || modelName.includes('meta-llama')) {
      return 'llama';  // Use 'llama' instead of 'llama3.2' to match actual model_type
    }

    // Check for Mistral models
    if (modelName.includes('mistral') || modelName.includes('mixtral')) {
      return 'mistral';
    }

    // Check tags for model architecture
    for (const tag of tags) {
      if (typeof tag === 'string') {
        const tagLower = tag.toLowerCase();
        if (tagLower.includes('llama')) {
          return 'llama';  // Use 'llama' instead of 'llama3.2'
        }
        if (tagLower.includes('mistral')) {
          return 'mistral';
        }
      }
    }

    // Check pipeline tag
    if (pipelineTag && pipelineTag.includes('text-generation')) {
      // Default to llama for text generation models if we can't determine otherwise
      if (modelName.includes('7b') || modelName.includes('8b') || modelName.includes('13b')) {
        return 'llama3.2';
      }
    }

    // Default to custom if we can't determine the type
    return 'custom';
  };
  