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
  