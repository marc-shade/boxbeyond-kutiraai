// src/utils/healthCheck.js
export const checkServiceHealth = async () => {
    try {
      const response = await fetch('http://localhost:9202/health');
      if (!response.ok) {
        throw new Error('Health check failed');
      }
      const healthData = await response.json();
  
      // Check if both API and Celery are healthy
      const isApiHealthy = healthData.services.api.status === 'healthy';
      const isCeleryHealthy = healthData.services.celery.status === 'healthy' && 
                             healthData.services.celery.workers.length > 0;
  
      return {
        isHealthy: isApiHealthy && isCeleryHealthy,
        status: {
          api: {
            healthy: isApiHealthy,
            status: healthData.services.api.status
          },
          celery: {
            healthy: isCeleryHealthy,
            status: healthData.services.celery.status,
            workers: healthData.services.celery.workers
          }
        },
        error: null
      };
    } catch (error) {
      return {
        isHealthy: false,
        status: {
          api: { healthy: false, status: 'unreachable' },
          celery: { healthy: false, status: 'unreachable', workers: [] }
        },
        error: 'Failed to check service health'
      };
    }
  };
  