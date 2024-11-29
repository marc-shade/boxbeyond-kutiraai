import React, { useState, useEffect } from 'react';
import { Stepper, Step, StepLabel, LinearProgress, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import axios from 'axios';

const subSteps = [
  'Fine tuning',
  'Fuse model',
  'Convert to GGUF',
  'Modelfile creation',
  'Ollama create',
];

const API_URL = 'http://localhost:9000'

function FineTuneProcessSteps({ formData }) {
  const [activeSubStep, setActiveSubStep] = useState(0);
  const [responses, setResponses] = useState({});
  const [stepStatus, setStepStatus] = useState({});
  const [error, setError] = useState(null);
  const [openLog, setOpenLog] = useState(false);
  const [currentLog, setCurrentLog] = useState('');

  useEffect(() => {
    const runStep = async () => {
      try {
        if (activeSubStep < subSteps.length) {

          const { success, message } = await callApi(activeSubStep);
          if (success) {
            setResponses((prev) => ({ ...prev, [activeSubStep]: message }));
            setStepStatus((prev) => ({ ...prev, [activeSubStep]: 'success' }));
            setActiveSubStep((prev) => prev + 1);
          } else {
            throw new Error(message);
          }
        }
      } catch (err) {
        setError(err);
        setStepStatus((prev) => ({ ...prev, [activeSubStep]: 'error' }));
      }
    };

    runStep();
  }, [activeSubStep]);

  const callApi = async (step) => {
    // check the step and then invoke api accordingly
    let response = {};
    if (step === 0) {
      response = await axios.post(API_URL + "/finetune", {
        formData
      });
    } else if (step === 1) {
      response = await axios.post(API_URL + "/fuse", {
        formData
      });
    } else if (step === 2) {
      response = await axios.post(API_URL + "/convert", {
        formData
      });
    } else if (step === 3) {
      response = await axios.post(API_URL + "/modelfile", {
        formData
      });
    } else if (step === 4) {
      response = await axios.post(API_URL + "/create", {
        formData
      });
    }
    console.log(response);
    if (response.status === 200 && response.data?.code === 0) {
      return { success: true, message: response.stdout }
    } else {
      setStepStatus('error');
      setError(response.stderr);
      return { success: false, message: response.stderr }
    }
  };

  const handleViewLog = (step) => {
    setCurrentLog(responses[step] || '');
    setOpenLog(true);
  };

  const handleCloseLog = () => {
    setOpenLog(false);
  };

  return (
    <div>
      <Stepper activeStep={activeSubStep} orientation="vertical">
        {subSteps.map((label, index) => (
          <Step key={label}>
            <StepLabel
              error={stepStatus[index] === 'error'}
              style={{ color: stepStatus[index] === 'success' ? 'green' : undefined }}
            >
              {label}
              {responses[index] && (
                <Button size="small" onClick={() => handleViewLog(index)}>
                  View Log
                </Button>
              )}
            </StepLabel>
            {index === activeSubStep && stepStatus !== 'error' && <LinearProgress />}
          </Step>
        ))}
      </Stepper>
      {error && <Typography color="error">{error.message}</Typography>}

      <Dialog open={openLog} onClose={handleCloseLog}>
        <DialogTitle>Log</DialogTitle>
        <DialogContent>
          <Typography>{currentLog}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLog}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default FineTuneProcessSteps;