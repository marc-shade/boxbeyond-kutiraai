import React, { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  Box,
  Typography,
  TextField,
  Stack,
  Select, 
  MenuItem,
} from '@mui/material';
import axios from 'axios';

function SingleDatasetModal({ open, handleClose, handleSave }) {
  const [modelTemplates, setModelTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    inputLocation: '',
    systemPrompt: '',
    promptTemplate: ''
  });

  useEffect(() => {
    const fetchTemplates = async (slug) => {
      console.log("fetching templates");
      setLoading(true);
      try {
        const response = await axios.get("http://localhost:9000/dataset-templates");
        console.log(response.data);
        setModelTemplates(response.data.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch dataset');
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSave = () => {
    handleSave(formData);
    handleClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
      }}>
        <Typography id="modal-title" variant="h6" component="h2">
          Create Dataset Details
        </Typography>
        <Stack spacing={2} mt={2}>
          <TextField
            name="name"
            label="Name"
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            name="description"
            label="Description"
            value={formData.description}
            multiline
            rows={3}
            onChange={handleChange}
          />
          <TextField
            name="inputLocation"
            label="Source Location"
            value={formData.inputLocation}
            onChange={handleChange}
          />
          <TextField
            name="systemPrompt"
            label="System Prompt"
            value={formData.systemPrompt}
            multiline
            rows={3}
            onChange={handleChange}
          />
          
          <Select
            labelId="demo-simple-select-label"
            id="promptTemplate"
            value={formData.promptTemplate}
            label="Model"
            onChange={(event) => setFormData({ ...formData, promptTemplate: event.target.value })}
            sx={{ mt: 2}}
          >
            {modelTemplates.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.model_name}
              </MenuItem>
            ))}
          </Select>
          <Button onClick={onSave}>Save</Button>
        </Stack>
      </Box>
    </Modal>
  );
}

export default SingleDatasetModal;