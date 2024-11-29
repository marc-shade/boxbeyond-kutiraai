import React, { useState, useEffect } from 'react';
import {
    Modal,
    Box,
    Typography,
    Link,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const FineTunedModalList = () => {
    const [models, setModels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [selectedDataset, setSelectedDataset] = useState('');
   

    useEffect(() => {
        // Simulating API call
        const fetchData = async () => {
            // Replace this with your actual API call
            const response = await new Promise(resolve =>
                setTimeout(() => resolve(stubData), 1000)
            );
            setModels(response);
            setLoading(false);
        };

        fetchData();
    }, []);

    const handleOpenModal = (dataset) => {
        setSelectedDataset(dataset);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'modelName', headerName: 'Model Name', width: 200 },
        { field: 'fineTunedOn', headerName: 'Fine Tuned On', width: 200 },
        {
            field: 'dataSetUsed',
            headerName: 'Data Set Used',
            width: 200,
            renderCell: (params) => (
                <Link
                    component="button"
                    variant="body2"
                    onClick={() => handleOpenModal(params.value)}
                >
                    (click here)
                </Link>
            ),
        },
    ];

   

    return (
        <Box sx={{ height: 400, width: '100%' }}>
            <Typography variant="h5" gutterBottom>Fine Tuned Models</Typography>
            <DataGrid
                rows={models}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 20]}
                disableSelectionOnClick
                loading={loading}
            />
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
                    width: 400,
                    bgcolor: 'background.paper',
                    border: '2px solid #000',
                    boxShadow: 24,
                    p: 4,
                }}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        Dataset Details
                    </Typography>
                    <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                        {selectedDataset}
                    </Typography>
                </Box>
            </Modal>
        </Box>
    );
};

// Stub data
const stubData = [
    { id: 1, modelName: 'Model A', fineTunedOn: '2023-05-01', dataSetUsed: 'Dataset X' },
    { id: 2, modelName: 'Model B', fineTunedOn: '2023-05-05', dataSetUsed: 'Dataset Y' },
    { id: 3, modelName: 'Model C', fineTunedOn: '2023-05-10', dataSetUsed: 'Dataset Z' },
    { id: 4, modelName: 'Model D', fineTunedOn: '2023-05-15', dataSetUsed: 'Dataset W' },
    { id: 5, modelName: 'Model E', fineTunedOn: '2023-05-20', dataSetUsed: 'Dataset V' },
];

export default FineTunedModalList;