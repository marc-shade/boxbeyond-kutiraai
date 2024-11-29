import React, { useState, useEffect } from 'react';
import { Box, Select, MenuItem } from '@mui/material';
import axios from 'axios';

const FolderSelector = ({ onFolderSelect }) => {
    const [dataset, setDataset] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDataset, setSelectedDataset] = useState([]);
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

    const handleDatasetSelect = (event) => {
        console.log(event.target.value);
        const selecteDataset = dataset.find(item => item.id === event.target.value);
        console.log(selecteDataset);
        setSelectedDataset(selecteDataset.id);
    };

    return (
        <Box display="flex" alignItems="center" gap={2}>
           <Select
                value={selectedDataset}
                onChange={handleDatasetSelect}
                displayEmpty
                fullWidth
                sx={{ mb: 2 }}
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
    );
};

export default FolderSelector;