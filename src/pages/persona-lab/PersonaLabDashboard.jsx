import { useState, useEffect } from 'react';

// material-ui
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Fab from '@mui/material/Fab';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { Add as AddIcon } from '@mui/icons-material';

// project import
import MainCard from 'components/MainCard';
import { GlassmorphicCard } from 'themes/GlassmorphicComponents';
import PersonaModal from './PersonaModal';
import ExperimentModal from './ExperimentModal';
import FocusGroupModal from './FocusGroupModal';
import ExperimentResultsModal from './ExperimentResultsModal';
import ExperimentMonitor from './ExperimentMonitor';
import PersonaAnalytics from './PersonaAnalytics';
import PersonaComparison from './PersonaComparison';
import ExperimentTemplates from './ExperimentTemplates';
import ExportResults from './ExportResults';

// API - Using Real Implementation
import personaLabAPI from 'api/persona-lab-real';
import { personaLabMCP } from 'utils/mcpIntegration';
import { useMCPWebSocket } from 'hooks/useWebSocket';

// ==============================|| PERSONA LAB DASHBOARD ||============================== //

export default function PersonaLabDashboard() {
  const [personas, setPersonas] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [focusGroups, setFocusGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [personaModalOpen, setPersonaModalOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [experimentModalOpen, setExperimentModalOpen] = useState(false);
  const [selectedExperiment, setSelectedExperiment] = useState(null);
  const [focusGroupModalOpen, setFocusGroupModalOpen] = useState(false);
  const [selectedFocusGroup, setSelectedFocusGroup] = useState(null);
  const [mcpStatus, setMcpStatus] = useState(null);
  const [runningExperiments, setRunningExperiments] = useState(new Set());
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [selectedResultsExperiment, setSelectedResultsExperiment] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // WebSocket integration for real-time updates
  const { isConnected, lastMessage } = useMCPWebSocket((message) => {
    if (message.type === 'experiment_update') {
      // Update experiment status in real-time
      setExperiments(prev => prev.map(exp =>
        exp.id === message.data.id ? { ...exp, ...message.data } : exp
      ));
    } else if (message.type === 'persona_update') {
      // Update persona in real-time
      setPersonas(prev => prev.map(persona =>
        persona.id === message.data.id ? { ...persona, ...message.data } : persona
      ));
    } else if (message.type === 'mcp_status') {
      setMcpStatus(message.data);
    }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [personasRes, experimentsRes] = await Promise.all([
          personaLabAPI.getPersonas(),
          personaLabAPI.getExperiments()
        ]);

        if (personasRes.success) setPersonas(personasRes.data || []);
        if (experimentsRes.success) setExperiments(experimentsRes.data || []);
        // Focus groups are managed through experiments in the real API
        setFocusGroups([]);

        // Check MCP status
        const status = await personaLabMCP.getStatus();
        setMcpStatus(status);
      } catch (err) {
        console.error('Error fetching persona lab data:', err);
        setError('Failed to load persona lab data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRunExperiment = async (experimentId) => {
    try {
      setRunningExperiments(prev => new Set([...prev, experimentId]));
      
      // Find the experiment data
      const experiment = experiments.find(exp => exp.id === experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      // Start the experiment via API
      const apiResult = await personaLabAPI.runExperiment(experimentId);
      
      // Orchestrate AI agents via MCP
      const mcpResult = await personaLabMCP.orchestrateExperiment({
        id: experimentId,
        name: experiment.name,
        target_personas: experiment.target_personas || [],
        test_scenarios: experiment.test_scenarios || []
      });
      
      if (apiResult.success) {
        // Update experiment status locally
        setExperiments(prev => prev.map(exp => 
          exp.id === experimentId ? { ...exp, status: 'running' } : exp
        ));
        
        const mcpStatusMessage = mcpResult.success 
          ? `🤖 ${mcpResult.participant_agents?.length || 0} AI agents spawned`
          : '⚠️ Using mock agents';
          
        alert(`✅ Experiment started successfully!\n${mcpStatusMessage}\n\nEstimated duration: ${apiResult.estimated_duration || mcpResult.estimated_duration || '5-10 minutes'}`);
        
        // Simulate experiment completion after delay
        setTimeout(() => {
          setRunningExperiments(prev => {
            const newSet = new Set(prev);
            newSet.delete(experimentId);
            return newSet;
          });
          setExperiments(prev => prev.map(exp => 
            exp.id === experimentId ? { ...exp, status: 'completed' } : exp
          ));
        }, 10000); // 10 seconds for demo
      }
    } catch (err) {
      console.error('Error running experiment:', err);
      setRunningExperiments(prev => {
        const newSet = new Set(prev);
        newSet.delete(experimentId);
        return newSet;
      });
      alert('Failed to run experiment: ' + err.message);
    }
  };

  const handleCreatePersona = () => {
    setSelectedPersona(null);
    setPersonaModalOpen(true);
  };

  const handleEditPersona = (persona) => {
    setSelectedPersona(persona);
    setPersonaModalOpen(true);
  };

  const handlePersonaSave = (savedPersona) => {
    if (selectedPersona) {
      // Update existing persona
      setPersonas(prev => prev.map(p => 
        p.id === savedPersona.id ? savedPersona : p
      ));
    } else {
      // Add new persona
      setPersonas(prev => [...prev, savedPersona]);
    }
  };

  const handleModalClose = () => {
    setPersonaModalOpen(false);
    setSelectedPersona(null);
  };

  const handleCreateExperiment = () => {
    setSelectedExperiment(null);
    setExperimentModalOpen(true);
  };

  const handleEditExperiment = (experiment) => {
    setSelectedExperiment(experiment);
    setExperimentModalOpen(true);
  };

  const handleExperimentSave = (savedExperiment) => {
    if (selectedExperiment) {
      // Update existing experiment
      setExperiments(prev => prev.map(exp => 
        exp.id === savedExperiment.id ? savedExperiment : exp
      ));
    } else {
      // Add new experiment
      setExperiments(prev => [...prev, savedExperiment]);
    }
  };

  const handleExperimentModalClose = () => {
    setExperimentModalOpen(false);
    setSelectedExperiment(null);
  };

  const handleCreateFocusGroup = () => {
    setSelectedFocusGroup(null);
    setFocusGroupModalOpen(true);
  };

  const handleEditFocusGroup = (focusGroup) => {
    setSelectedFocusGroup(focusGroup);
    setFocusGroupModalOpen(true);
  };

  const handleFocusGroupSave = (savedFocusGroup) => {
    if (selectedFocusGroup) {
      // Update existing focus group
      setFocusGroups(prev => prev.map(fg => 
        fg.id === savedFocusGroup.id ? savedFocusGroup : fg
      ));
    } else {
      // Add new focus group
      setFocusGroups(prev => [...prev, savedFocusGroup]);
    }
  };

  const handleFocusGroupModalClose = () => {
    setFocusGroupModalOpen(false);
    setSelectedFocusGroup(null);
  };

  const handleViewResults = (experiment) => {
    setSelectedResultsExperiment(experiment);
    setResultsModalOpen(true);
  };

  const handleResultsModalClose = () => {
    setResultsModalOpen(false);
    setSelectedResultsExperiment(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'running': return 'warning';
      case 'active': return 'success';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* Header */}
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          Persona Lab Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Manage AI personas, run marketing experiments, and conduct focus groups using Claude Code agents
        </Typography>
      </Grid>

      {/* Stats Overview */}
      <Grid item xs={12} md={4}>
        <GlassmorphicCard>
          <CardContent>
            <Typography variant="h6" color="primary">
              Active Personas
            </Typography>
            <Typography variant="h3">
              {personas.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Ready for experiments
            </Typography>
          </CardContent>
        </GlassmorphicCard>
      </Grid>

      <Grid item xs={12} md={4}>
        <GlassmorphicCard>
          <CardContent>
            <Typography variant="h6" color="secondary">
              Running Experiments
            </Typography>
            <Typography variant="h3">
              {experiments.filter(exp => exp.status === 'running').length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Active tests
            </Typography>
          </CardContent>
        </GlassmorphicCard>
      </Grid>

      <Grid item xs={12} md={4}>
        <GlassmorphicCard>
          <CardContent>
            <Typography variant="h6" color="success.main">
              Focus Groups
            </Typography>
            <Typography variant="h3">
              {focusGroups.length}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Discussion sessions
            </Typography>
          </CardContent>
        </GlassmorphicCard>
      </Grid>

      {/* Navigation Tabs */}
      <Grid item xs={12}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} variant="scrollable" scrollButtons="auto">
            <Tab label="Dashboard" />
            <Tab label="Analytics" />
            <Tab label="Compare Personas" />
            <Tab label="Live Monitor" />
            <Tab label="Templates" />
            <Tab label="Export" />
          </Tabs>
        </Box>
      </Grid>

      {/* Tab Content */}
      <Grid item xs={12}>
        {activeTab === 0 && (
          <Box>
            {/* Dashboard content continues below */}

      {/* Personas Section */}
      <Grid item xs={12}>
        <MainCard title="AI Personas">
          <Grid container spacing={3}>
            {personas.map((persona) => (
              <Grid item xs={12} md={6} lg={4} key={persona.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ mr: 2 }}>
                        {persona.name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {persona.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {persona.occupation}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="body2" paragraph>
                      Age: {persona.age} • {persona.location}
                    </Typography>

                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Personality Traits:
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {persona.personality_traits?.slice(0, 3).map((trait) => (
                          <Chip key={trait} label={trait} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    </Box>

                    <Box mb={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Goals:
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {persona.goals?.slice(0, 2).join(', ')}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => handleEditPersona(persona)}>Edit</Button>
                    <Button size="small">View Details</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </MainCard>
      </Grid>

      {/* Experiments Section */}
      <Grid item xs={12}>
        <MainCard 
          title="Marketing Experiments"
          secondary={
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />}
              onClick={handleCreateExperiment}
            >
              New Experiment
            </Button>
          }
        >
          <Grid container spacing={3}>
            {experiments.map((experiment) => (
              <Grid item xs={12} md={6} key={experiment.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6">
                        {experiment.name}
                      </Typography>
                      <Chip 
                        label={experiment.status} 
                        color={getStatusColor(experiment.status)}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" paragraph>
                      {experiment.description}
                    </Typography>

                    <Typography variant="body2" color="textSecondary" paragraph>
                      <strong>Hypothesis:</strong> {experiment.hypothesis}
                    </Typography>

                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography variant="body2">
                        Personas: {experiment.persona_count}
                      </Typography>
                      <Typography variant="body2">
                        Scenarios: {experiment.scenario_count}
                      </Typography>
                    </Box>

                    <Typography variant="caption" color="textSecondary">
                      Created: {new Date(experiment.created_at).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    {experiment.status === 'draft' && (
                      <Button 
                        size="small" 
                        variant="contained"
                        onClick={() => handleRunExperiment(experiment.id)}
                      >
                        Run Experiment
                      </Button>
                    )}
                    {experiment.status === 'completed' && (
                      <Button 
                        size="small" 
                        onClick={() => handleViewResults(experiment)}
                        color="primary"
                      >
                        View Results
                      </Button>
                    )}
                    <Button size="small" onClick={() => handleEditExperiment(experiment)}>
                      Edit
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </MainCard>
      </Grid>

      {/* Focus Groups Section */}
      <Grid item xs={12}>
        <MainCard 
          title="Focus Groups"
          secondary={
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />}
              onClick={handleCreateFocusGroup}
            >
              New Focus Group
            </Button>
          }
        >
          <Grid container spacing={3}>
            {focusGroups.map((focusGroup) => (
              <Grid item xs={12} md={6} key={focusGroup.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6">
                        {focusGroup.topic}
                      </Typography>
                      <Chip 
                        label={focusGroup.status} 
                        color={getStatusColor(focusGroup.status)}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" paragraph>
                      <strong>Participants:</strong> {focusGroup.participants.join(', ')}
                    </Typography>

                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Typography variant="body2">
                        Rounds: {focusGroup.rounds}
                      </Typography>
                      <Typography variant="body2">
                        Participants: {focusGroup.participants.length}
                      </Typography>
                    </Box>

                    <Typography variant="caption" color="textSecondary">
                      Created: {new Date(focusGroup.created_at).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    {focusGroup.status === 'completed' && (
                      <Button size="small">View Discussion</Button>
                    )}
                    <Button size="small" onClick={() => handleEditFocusGroup(focusGroup)}>
                      Edit
                    </Button>
                    <Button size="small">Details</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </MainCard>
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add persona"
        onClick={handleCreatePersona}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
      >
        <AddIcon />
      </Fab>

          </Box>
        )}
        
        {activeTab === 1 && (
          <PersonaAnalytics personas={personas} experiments={experiments} />
        )}
        
        {activeTab === 2 && (
          <PersonaComparison personas={personas} />
        )}
        
        {activeTab === 3 && (
          <ExperimentMonitor 
            experiments={experiments} 
            onExperimentUpdate={(updatedExperiment) => {
              setExperiments(prev => prev.map(exp => 
                exp.id === updatedExperiment.id ? updatedExperiment : exp
              ));
            }}
          />
        )}
        
        {activeTab === 4 && (
          <ExperimentTemplates 
            onUseTemplate={(template) => {
              // Create new experiment from template
              const newExperiment = {
                id: Date.now().toString(),
                name: template.name,
                description: template.description,
                status: 'draft',
                scenarios: template.scenarios,
                metrics: template.metrics,
                target_personas: [],
                created_at: new Date().toISOString()
              };
              setSelectedExperiment(newExperiment);
              setExperimentModalOpen(true);
            }}
          />
        )}
        
        {activeTab === 5 && (
          <ExportResults 
            personas={personas}
            experiments={experiments}
          />
        )}
      </Grid>

      {/* Persona Modal */}
      <PersonaModal
        open={personaModalOpen}
        onClose={handleModalClose}
        persona={selectedPersona}
        onSave={handlePersonaSave}
      />

      {/* Experiment Modal */}
      <ExperimentModal
        open={experimentModalOpen}
        onClose={handleExperimentModalClose}
        experiment={selectedExperiment}
        onSave={handleExperimentSave}
      />

      {/* Focus Group Modal */}
      <FocusGroupModal
        open={focusGroupModalOpen}
        onClose={handleFocusGroupModalClose}
        focusGroup={selectedFocusGroup}
        onSave={handleFocusGroupSave}
      />

      {/* Experiment Results Modal */}
      <ExperimentResultsModal
        open={resultsModalOpen}
        onClose={handleResultsModalClose}
        experiment={selectedResultsExperiment}
      />
    </Grid>
  );
}