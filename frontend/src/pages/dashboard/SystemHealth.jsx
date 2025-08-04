import { useState, useEffect } from 'react';
import { Typography, Box, Stack, IconButton, Tooltip } from '@mui/material';
import MainCard from 'components/MainCard';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HelpIcon from '@mui/icons-material/Help';
import CircularProgress from '@mui/material/CircularProgress';
import { GlassmorphicCard } from 'themes/GlassmorphicComponents';

const StatusIcon = ({ status }) => {
  switch (status?.toLowerCase()) {
    case 'healthy':
      return <CheckCircleIcon sx={{ color: '#4caf50' }} />;
    case 'unhealthy':
      return <ErrorIcon sx={{ color: '#f44336' }} />;
    case 'unknown':
      return <HelpIcon sx={{ color: '#ff9800' }} />;
    default:
      return <CircularProgress size={20} />;
  }
};

const ServiceRow = ({ name, port, status, onRefresh, isRefreshing }) => (
  <Box sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    p: 1.5,
    '&:not(:last-child)': { borderBottom: '1px solid', borderColor: 'divider' },
    '&:hover': { bgcolor: 'background.neutral' }
  }}>
    <Stack spacing={1} sx={{ flex: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="subtitle1">{name}</Typography>
          <Typography color="text.secondary" variant="body2">Port: {port}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatusIcon status={status} />
          <Tooltip title="Refresh Status">
            <IconButton size="small" onClick={onRefresh} disabled={isRefreshing}>
              <RefreshIcon sx={{
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Stack>
  </Box>
);

const SystemHealth = () => {
  const [healthStatus, setHealthStatus] = useState({});
  const [refreshingServices, setRefreshingServices] = useState({});

  const checkServiceHealth = async (url) => {
    try {
      const response = await fetch(url, { mode: 'no-cors' });
      const data = await response.json();
      return data;
    } catch (error) {
      return { status: 'unhealthy' };
    }
  };

  const checkConsolidatedServiceHealth = async (url) => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === 'healthy' && data.services) {
        for (const value of Object.values(data.services)) {
          if (value.status !== 'healthy') {
            data.status = 'unhealthy';
            break;
          }
        }
      }
      return data;
    } catch (error) {
      return { status: 'unhealthy' };
    }
  };

  const checkDockerService = async (port) => {
    try {
      const response = await fetch(`http://localhost:${port}`);
      return { status: response.ok ? 'healthy' : 'unhealthy' };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  };

  const refreshService = async (serviceId, checkFn, ...args) => {
    setRefreshingServices(prev => ({ ...prev, [serviceId]: true }));
    const result = await checkFn(...args);
    setHealthStatus(prev => ({ ...prev, [serviceId]: result }));
    setRefreshingServices(prev => ({ ...prev, [serviceId]: false }));
  };

  useEffect(() => {
    const fetchHealthStatus = async () => {
      // Fetch consolidated health data from both APIs
      const fineTuneServices = await checkConsolidatedServiceHealth('http://localhost:8400/health');
      const agenticServices = await checkConsolidatedServiceHealth('http://localhost:8100/health');

      // Map the consolidated services to specific service IDs
      const mappedServices = {
        fineTuneApi: fineTuneServices.services?.api || { status: 'unknown' },
        database: fineTuneServices.services?.database || { status: 'unknown' },
        redis: fineTuneServices.services?.redis || { status: 'unknown' },
        celery: fineTuneServices.services?.celery || { status: 'unknown' },
        agenticWorkflow: agenticServices.services?.api || { status: 'unknown' },
        agenticWorkflowDb: agenticServices.services?.database || { status: 'unknown' }
      };

      // Fetch other individual services
      const otherServices = {
        vectorStore: await checkDockerService(6333),
        n8n: "healthy",
        n8nDb: "healthy"
      };

      // Combine all statuses into one state
      setHealthStatus({ ...mappedServices, ...otherServices });
    };

    fetchHealthStatus();
    const interval = setInterval(fetchHealthStatus, 30000);
    return () => clearInterval(interval);
  }, []);


  const services = [
    { id: 'fineTuneApi', name: 'Fine Tune API', port: 8400, status: healthStatus.fineTuneApi?.status },
    { id: 'database', name: 'Web Backend DB', port: 5434, status: healthStatus.database?.status },
    { id: 'redis', name: 'Redis', port: 6379, status: healthStatus.redis?.status },
    { id: 'celery', name: 'Celery Worker', port: null, status: healthStatus.celery?.status },
    { id: 'vectorStore', name: 'Vector Store', port: 6333, status: healthStatus.vectorStore?.status },
    { id: 'n8n', name: 'n8n', port: 5678, status: "healthy" },
    { id: 'n8nDb', name: 'n8n Database', port: 5432, status: "healthy" },
    { id: 'agenticWorkflow', name: 'Agentic Workflow', port: 8100, status: healthStatus.agenticWorkflow?.status },
    { id: 'agenticWorkflowDb', name: 'Agentic Workflow DB', port: 5433, status: healthStatus.agenticWorkflowDb?.status }
  ];

  return (
    <MainCard title={<Typography variant="h5">System Health</Typography>} sx={{ '& .MuiCardContent-root': { p: 0, '&:last-child': { pb: 0 } } }}>
      {services.map((service) => (
        <ServiceRow
          key={service.id}
          {...service}
          isRefreshing={refreshingServices[service.id]}
          onRefresh={() => refreshService(service.id, checkServiceHealth, `http://localhost:${service.port}/health`)}
        />
      ))}
    </MainCard>
  );
};

export default SystemHealth;
