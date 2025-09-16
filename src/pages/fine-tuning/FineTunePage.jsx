import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChooseModel from './components/ChooseModel';
import ChooseDataset from './components/ChooseDataset';
import FineTuneSettings from './components/FineTuneSettings';
import FineTuneReview from './components/FineTuneReview';
import SaveConfiguration from './components/SaveConfiguration';
import SavedConfigurations from './components/SavedConfigurations';
import fineTuningService from 'services/real-fine-tuning-service'; // Using real service
import { determineModelType } from '../../utils/validation';
import { datasetService } from './services/datasetServices';
import { checkServiceHealth } from './services/healthCheck';
import ConfirmationDialog from './components/ConfirmationDialog';

const steps = [
  { label: 'Choose Model', description: 'Select a base model to fine-tune' },
  { label: 'Choose Dataset', description: 'Select the training dataset' },
  { label: 'Settings', description: 'Configure training parameters' },
  { label: 'Review', description: 'Review your selections' },
  { label: 'Save', description: 'Save configuration' }
];

function FineTunePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [showConfigurationForm, setShowConfigurationForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [configName, setConfigName] = useState('');
  const [saveError, setSaveError] = useState(null);
  const [savedConfigurations, setSavedConfigurations] = useState([]);
  // Add a new state to track if we're editing
  const [editingConfigId, setEditingConfigId] = useState(null);
  const [launchDialogOpen, setLaunchDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchingConfigId, setLaunchingConfigId] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' // can be 'error', 'warning', 'info', or 'success'
  });

  const [formData, setFormData] = useState({
    baseModel: null,
    dataset: null,
    settings: {
      finetuned_model_name: '',
      processed_file_full_path: '',
      num_iterations: 1000,
      steps_per_eval: 100,
      num_layers: 16,
      learning_rate: '1e-5',
      batch_size: 25,
      train_split: 70,
      validation_split: 20,
      test_split: 10,
      advancedMode: false
    }
  });

  useEffect(() => {
    fetchSavedConfigurations();
  }, []);

  const fetchSavedConfigurations = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      }
      // For now, use empty array since real service doesn't have getFinetunes
      // You can integrate this with the listDatasets method if needed
      const datasets = await fineTuningService.listDatasets();
      setSavedConfigurations(datasets.data || []);
    } catch (error) {
      console.error('Error fetching configurations:', error);
    } finally {
      if (showRefreshing) {
        setIsRefreshing(false);
      }
    }
  };

  const handleModelUpdate = (model) => {
    setFormData(prev => ({
      ...prev,
      baseModel: model
    }));
  };

  const handleDatasetUpdate = (dataset) => {
    setFormData(prev => ({
      ...prev,
      dataset: dataset
    }));
  };

  const handleSettingsUpdate = (settings) => {
    setFormData(prev => ({
      ...prev,
      settings: settings
    }));
  };

  const handleSaveConfiguration = async () => {
    if (!configName.trim()) {
      setSaveError('Configuration name is required');
      return false;
    }

    try {
      setIsSaving(true);
      setSaveError(null);

      const configData = {
        model_name: configName,
        base_model: formData.baseModel.id || formData.baseModel,
        model_owner: formData.baseModel.author,
        model_type: formData.baseModel.model_type || determineModelType(formData.baseModel),
        dataset_id: formData.dataset?.id,
        num_iterations: formData.settings.num_iterations,
        steps_per_eval: formData.settings.steps_per_eval,
        num_layers: formData.settings.num_layers,
        learning_rate: formData.settings.learning_rate,
        batch_size: formData.settings.batch_size,
        train_split: formData.settings.train_split,
        validation_split: formData.settings.validation_split,
        test_split: formData.settings.test_split,
        processed_file_full_path: formData.settings.processed_file_full_path || '/tmp/processed',
        finetuned_model_name: formData.settings.finetuned_model_name || 'finetuned_model'
      };

      console.log(editingConfigId ? 'Updating' : 'Creating', 'configuration:', configData);

      let savedConfig;
      if (editingConfigId) {
        // Update existing configuration
        savedConfig = await finetuneService.updateFinetune(editingConfigId, configData);
        console.log('Configuration updated:', savedConfig);
      } else {
        // Create new configuration
        savedConfig = await finetuneService.createFinetune(configData);
        console.log('Configuration created:', savedConfig);
      }

      await fetchSavedConfigurations();
      handleCloseForm();
      return true;
    } catch (err) {
      console.error('Error saving configuration:', err);
      setSaveError(err.message || 'Failed to save configuration');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditConfiguration = async (config) => {


    // Fetch the dataset details using the service
    let datasetDetails = null;
    if (config.dataset_id) {
      try {
        datasetDetails = await datasetService.getDatasetById(config.dataset_id);
      } catch (error) {
        console.error('Error fetching dataset details:', error);
        // Continue with available data even if dataset fetch fails
      }
    }

    let baseModel = {
      id: config.base_model,
      author: config.model_owner,
      model_type: config.model_type || determineModelType({ id: config.base_model }),
      description: ''
    }
    setFormData({
      baseModel: baseModel,
      dataset: {
        id: config.dataset_id,
        dataset_name: datasetDetails?.dataset_name || 'Unknown',
        dataset_desc: datasetDetails?.dataset_desc || '',
        dataset_status: datasetDetails?.dataset_status || 'Unknown'
      },
      settings: {
        finetuned_model_name: config.finetuned_model_name,
        processed_file_full_path: config.processed_file_full_path || '',
        num_iterations: config.num_iterations || 1000,
        steps_per_eval: config.steps_per_eval || 100,
        num_layers: config.num_layers || 16,
        learning_rate: config.learning_rate || '1e-5',
        batch_size: config.batch_size || 25,
        train_split: config.train_split || 70,
        validation_split: config.validation_split || 20,
        test_split: config.test_split || 10,
        advancedMode: false
      }
    });

    console.log(datasetDetails);

    setConfigName(config.model_name);
    setEditingConfigId(config.id); // Set the editing ID
    setShowConfigurationForm(true);
    setActiveStep(0);
    setSaveError(null);
  };

  const handleDeleteConfiguration = async (config) => {
    if (!config || !config.id) {
      console.error('No configuration ID provided for deletion');
      return;
    }

    try {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete the configuration "${config.model_name}"?`
      );

      if (!confirmDelete) {
        return;
      }

      await finetuneService.deleteFinetune(config.id);
      await fetchSavedConfigurations();
      console.log('Configuration deleted successfully');
    } catch (error) {
      console.error('Error deleting configuration:', error);
      alert('Failed to delete configuration: ' + (error.message || 'Unknown error'));
    }
  };

  const handleLaunchClick = async (config) => {
    setSelectedConfig(config);
    setLaunchingConfigId(config.id);

    // Check services health before launching
    const healthStatus = await checkServiceHealth();

    if (!healthStatus.isHealthy) {
      let errorMessage = 'Cannot launch fine-tuning: ';
      if (!healthStatus.status.api.healthy) {
        errorMessage += 'API service is not available. ';
      }
      if (!healthStatus.status.celery.healthy) {
        errorMessage += 'Celery workers are not available. ';
      }

      // Use your existing notification/alert system
      enqueueSnackbar(errorMessage, { variant: 'error' });
      setLaunchingConfigId(null);
      return;
    }

    setLaunchDialogOpen(true);
  };

  const handleLaunchCancel = () => {
    setLaunchDialogOpen(false);
    setSelectedConfig(null);
    setLaunchingConfigId(null);
  };

  const handleLaunchConfirm = async () => {
    try {
      setIsLaunching(true);

      const response = await finetuneService.launchTraining(String(selectedConfig.id));

      // Show immediate success message
      setSnackbar({
        open: true,
        message: 'Fine-tuning process started successfully! Refreshing data...',
        severity: 'success'
      });

      // Wait a moment for the database to be updated, then refresh
      setTimeout(async () => {
        await fetchSavedConfigurations(true); // Show refreshing indicator

        // Update success message to indicate data is refreshed
        setSnackbar({
          open: true,
          message: 'Fine-tuning started! You can now click "View Progress" to monitor the process.',
          severity: 'success'
        });
      }, 1000); // 1 second delay

      // Close the launch confirmation dialog
      handleLaunchCancel();

      console.log('Fine-tuning task started:', response.task_id);

    } catch (error) {
      console.error('Error launching fine-tuning:', error);
      setSnackbar({
        open: true,
        message: 'Failed to start fine-tuning process',
        severity: 'error'
      });
    } finally {
      setIsLaunching(false);
      setLaunchingConfigId(null);
    }
  };

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      await handleSaveConfiguration();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleCloseForm = () => {
    setShowConfigurationForm(false);
    setActiveStep(0);
    setConfigName('');
    setSaveError(null);
    setEditingConfigId(null); // Reset editing ID
    setFormData({
      baseModel: null,
      dataset: null,
      settings: {
        finetuned_model_name: '',
        processed_file_full_path: '',
        num_iterations: 1000,
        steps_per_eval: 100,
        num_layers: 16,
        learning_rate: '1e-5',
        batch_size: 25,
        train_split: 70,
        validation_split: 20,
        test_split: 10,
        advancedMode: false
      }
    });
  };

  const isStepComplete = () => {
    switch (activeStep) {
      case 0:
        return !!formData.baseModel;
      case 1:
        return !!formData.dataset;
      case 2:
        return !!formData.settings;
      case 3:
        return true;
      case 4:
        return !!configName.trim();
      default:
        return false;
    }
  };

  // Add handleSnackbarClose function
  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Container maxWidth="lg">
        {launchDialogOpen && <ConfirmationDialog
          open={launchDialogOpen}
          onClose={handleLaunchCancel}
          onConfirm={handleLaunchConfirm}
          title="Launch Training"
          content="Are you sure you want to launch the training process? This operation cannot be interrupted once started."
          loading={isLaunching}
          config={selectedConfig}
        />}
        <Box sx={{ py: 4, ml:1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4" component="h1" gutterBottom>
              Fine-tuning Configurations
            </Typography>
            {!showConfigurationForm && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => setShowConfigurationForm(true)}
              >
                Create Configuration
              </Button>
            )}
          </Box>

          {showConfigurationForm ? (
            <>
              <Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
                {steps.map((step) => (
                  <Step key={step.label}>
                    <StepLabel>
                      <Typography variant="body2">{step.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {step.description}
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              <Box sx={{ mt: 4, mb: 4 }}>
                {activeStep === 0 && (
                  <ChooseModel formData={formData} onUpdate={handleModelUpdate} />
                )}
                {activeStep === 1 && (
                  <ChooseDataset formData={formData} onUpdate={handleDatasetUpdate} />
                )}
                {activeStep === 2 && (
                  <FineTuneSettings
                    formData={formData.settings}
                    onUpdate={handleSettingsUpdate}
                  />
                )}
                {activeStep === 3 && (
                  <FineTuneReview formData={formData} />
                )}
                {activeStep === 4 && (
                  <SaveConfiguration
                    configName={configName}
                    onConfigNameChange={setConfigName}
                    error={saveError}
                    isSaving={isSaving}
                    formData={formData}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button
                  onClick={() => {
                    if (activeStep === 0) {
                      handleCloseForm();
                    } else {
                      handleBack();
                    }
                  }}
                >
                  {activeStep === 0 ? 'Cancel' : 'Back'}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={isSaving || !isStepComplete()}
                >
                  {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </Box>

            </>
          ) : (
            <SavedConfigurations
              savedConfigurations={savedConfigurations}
              onEdit={handleEditConfiguration}
              onLaunch={handleLaunchClick}
              onDelete={handleDeleteConfiguration}
              loading={isLaunching}
              launchingConfigId={launchingConfigId}
              refreshing={isRefreshing}
            />
          )}
        </Box>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

export default FineTunePage;
