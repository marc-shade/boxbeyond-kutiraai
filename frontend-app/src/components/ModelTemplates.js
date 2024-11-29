import React, { useState, useEffect } from 'react';
import {
    DataGrid,
    GridToolbar
} from '@mui/x-data-grid';
import {
    Button,
    Modal,
    Box,
    TextField,
    Typography
} from '@mui/material';
import axios from 'axios';

const ModelTemplates = () => {
    const [modelTemplates, setModelTemplates] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentModel, setCurrentModel] = useState({ id: null, model_name: '', model_template: '', model_description: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        fetchTemplates();
    }, []);

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

    const openModal = (model = { id: null, model_name: '', model_template: '', model_description: '' }) => {
        setCurrentModel(model);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setCurrentModel({ id: null, model_name: '', model_template: '', model_description: '' });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentModel({ ...currentModel, [name]: value });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await axios.post("http://localhost:9000/dataset-templates", {
                currentModel
            });
            setLoading(false);
            closeModal();
            fetchTemplates();
        } catch (err) {
            setError('Failed to fetch dataset');
            setLoading(false);
        }


    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 70 },
        { field: 'model_name', headerName: 'Model Name', width: 200 },
        { field: 'model_description', headerName: 'Description', width: 300 },
        { field: 'model_template', headerName: 'Template', width: 300 },
    ];

    return (
        <div style={{ height: 400, width: '100%' }}>


            <DataGrid
                rows={modelTemplates}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5]}
                components={{
                    Toolbar: GridToolbar,
                }}
                onRowClick={(params) => openModal(params.row)}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button variant="contained" onClick={() => openModal()} style={{ marginBottom: 20 }}>
                    Add New Template
                </Button>
            </Box>

            <Modal
                open={isModalOpen}
                onClose={closeModal}
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
                    boxShadow: 24,
                    p: 4,
                }}>
                    <Typography id="modal-title" variant="h6" component="h2">
                        {currentModel.id ? 'Edit Model' : 'Add New Model'}
                    </Typography>
                    <TextField
                        fullWidth
                        margin="normal"
                        name="model_name"
                        label="Model Name"
                        value={currentModel.model_name}
                        onChange={handleInputChange}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        name="model_description"
                        label="Description"
                        multiline
                        rows={3}
                        value={currentModel.model_description}
                        onChange={handleInputChange}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        name="model_template"
                        label="Template"
                        multiline
                        rows={5}
                        value={currentModel.model_template}
                        onChange={handleInputChange}
                    />
                    <Button onClick={handleSave} variant="contained" sx={{ mt: 2, mr: 1 }}>
                        Save
                    </Button>
                    <Button onClick={closeModal} variant="outlined" sx={{ mt: 2 }}>
                        Cancel
                    </Button>
                </Box>
            </Modal>
        </div >
    );
};

export default ModelTemplates;