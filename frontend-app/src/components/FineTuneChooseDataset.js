import React, { useState, useEffect } from 'react';
import { Box, Select, MenuItem, TextField } from '@mui/material';
import axios from 'axios';

function FineTuneChooseDataset({ formData }) {
    const [datasetPath, setDatasetPath] = useState(formData.dataset_path || '');
    const [dataset, setDataset] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDataset, setSelectedDataset] = useState([]);
    const [testPercent, setTestPercent] = useState(formData.test_percent || '');
    const [validationPercent, setValidationPercent] = useState(formData.validation_percent || '');
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDataset = async () => {
            console.log("Fetching dataset");
            setLoading(true);
            try {
                const response = await axios.get("http://localhost:9000/dataset");
                console.log(response.data);
                setDataset(response.data.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch dataset');
                setLoading(false);
            }
        };

        fetchDataset();

    }, []);

    const handleTestChange = (event) => {
        const value = event.target.value;
        setTestPercent(value);
        formData.test_percent = value;
    };

    const handleValidationChange = (event) => {
        const value = event.target.value;
        setValidationPercent(value);
        formData.validation_percent = value;
    };

    const handleDatasetSelect = (event) => {
        console.log(event.target.value);
        const selecteDataset = dataset.find(item => item.id === event.target.value);
        console.log(selecteDataset);
        setSelectedDataset(selecteDataset.id);
        setDatasetPath(selecteDataset.dataset_input_location);
        // convert to string
        formData.dataset_id = selecteDataset.id.toString();
    };

    return (
        <Box>
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '50%',
                alignItems: 'center',
                margin: '0 auto',
                mt: 2,
                gap: 2  // This adds space between the elements
            }}>
                <Box sx={{ width: '100%' }}>
                    <Select
                        value={selectedDataset}
                        onChange={handleDatasetSelect}
                        displayEmpty
                        fullWidth
                    >
                        <MenuItem value="" disabled>
                            Select a Dataset
                        </MenuItem>
                        {dataset?.map((item) => (
                            <MenuItem key={item.dataset_name} value={item.id}>
                                {item.dataset_name}
                            </MenuItem>
                        ))}
                    </Select>
                </Box>
                <Box sx={{ width: '100%' }}>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Test Percent"
                        fullWidth
                        value={testPercent}
                        onChange={handleTestChange}
                    />
                </Box>
                <Box sx={{ width: '100%' }}>
                    <TextField
                        margin="dense"
                        label="Validation Percent"
                        fullWidth
                        value={validationPercent}
                        onChange={handleValidationChange}
                    />
                </Box>
            </Box>
        </Box>
    );
}

export default FineTuneChooseDataset;