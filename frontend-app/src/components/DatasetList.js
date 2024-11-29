import React, { useState, useEffect } from 'react';
import {
    Button,
    Modal,
    Box,
    Typography,
    Link
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import SingleDatasetModal  from './SingleDatasetModal';

const DatasetList = () => {
    const [dataset, setDataset] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [selectedDataset, setSelectedDataset] = useState([]);
    const [selectedModalColumns, setSelectedModalColumns] = useState([]);
    const [error, setError] = useState(null);
    const [createDatasetModalOpen, setCreateDatasetModalOpen] = useState(false);

    const handleCreateDatasetOpen = () => setCreateDatasetModalOpen(true);
    const handleCreateDatasetClose = () => setCreateDatasetModalOpen(false);

    useEffect(() => {
        fetchDataset();
    }, []);

    const fetchDataset = async (slug) => {
        console.log("fetching dataset");
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

    const handleOpenModal = (dataset, origin) => {
        setSelectedDataset(dataset);
        if (origin === "source"){
           // setSelectedModalColumns(modal_source_columns)
        } else {
          // setSelectedModalColumns(modal_output_columns)
        }
        
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    const saveDataset = async (formData) => {
        setLoading(true);
        try {
            const response = await axios.post("http://localhost:9000/dataset", {
                formData
            });
            console.log(response.data);
            setLoading(false);
            fetchDataset();
        } catch (err) {
            setError('Failed to fetch dataset');
            setLoading(false);
        }
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'dataset_name', headerName: 'Dataset Name', width: 100 },
        { field: 'dataset_desc', headerName: 'Description', width: 200 },
        { field: 'dataset_input_location', headerName: 'Source Location', width: 200 },
        { field: 'model_name', headerName: 'Model Template', width: 200 },
        { field: 'dataset_system_prompt', headerName: 'Model System Prompt', width: 200 },
        { field: 'dataset_status', headerName: 'Status', width: 200 }
    ];

    return (
        <Box sx={{ height: 400, width: '100%' }}>
            <Typography variant="h5" gutterBottom>Processed Dataset</Typography>
            <DataGrid
                rows={dataset}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
                disableSelectionOnClick
                loading={loading}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCreateDatasetOpen}
                >
                    Create Dataset
                </Button>
            </Box>
            {createDatasetModalOpen && <SingleDatasetModal open={createDatasetModalOpen} handleSave={saveDataset} handleClose={handleCreateDatasetClose} /> }
            <Modal
                open={openModal}
                onClose={handleCloseModal}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 600,
                    height: 400,
                    bgcolor: 'background.paper',
                    border: '2px solid #000',
                    boxShadow: 24,
                    p: 4,
                }}>
                    <Typography id="modal-modal-title" variant="h6" component="h2" gutterBottom>
                        Dataset Details
                    </Typography>
                    {selectedDataset && selectedDataset && (
                        <div style={{ height: 300, width: '100%' }}>
                            <DataGrid
                                rows={selectedDataset.map((file, index) => ({
                                    id: index,
                                    ...file
                                }))}
                                columns={selectedModalColumns}
                                pageSize={5}
                                rowsPerPageOptions={[5]}
                                checkboxSelection
                                disableSelectionOnClick
                            />
                        </div>
                    )}
                </Box>
            </Modal>
        </Box>
    );
};

export default DatasetList;