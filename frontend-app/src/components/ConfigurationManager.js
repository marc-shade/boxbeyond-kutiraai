import React, { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';

const ConfigurationManager = () => {
    const [configs, setConfigs] = useState([]);
    const [editingKey, setEditingKey] = useState(null);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchConfigurations();
    }, []);

    const fetchConfigurations = async () => {
        console.log("fetching configuration");
        setLoading(true);
        try {
            const response = await axios.get("http://localhost:9000/configuration");
            console.log(response.data);
            setConfigs(response.data.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch configurations');
            setLoading(false);
        }
    };

    const handleEdit = (key) => {
        setEditingKey(key);
    };

    const handleSave = async (config) => {
        try {
            await axios.post('http://localhost:9000/configuration', {
                configuration: {
                    config_name: config.config_name,
                    config_value: config.config_value
                }
            });
            setEditingKey(null);
            fetchConfigurations();
        } catch (err) {
            setError('Failed to update configuration');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:9000/configuration/${id}`);
            fetchConfigurations();
        } catch (err) {
            setError('Failed to delete configuration');
        }
    };

    const handleChange = (id, value) => {
        setConfigs(configs.map(config => 
            config.id === id ? { ...config, config_value: value } : config
        ));
    };

    const handleAdd = async () => {
        if (newKey && newValue) {
            try {
                await persistConfiguration(newKey, newValue);
                setIsAddDialogOpen(false);
                fetchConfigurations();
            } catch (err) {
                setError('Failed to add configuration');
            }
        }
    };

    const persistConfiguration = async (newKey, newValue) => {
        await axios.post("http://localhost:9000/configuration", {
            configuration: {
                config_name: newKey,
                config_value: newValue
            }
        });
        setNewKey('');
        setNewValue('');
    }

    if (loading) return <CircularProgress />;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Key</TableCell>
                            <TableCell>Value</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {configs.map((configuration) => (
                            <TableRow key={configuration.id}>
                                <TableCell>{configuration.config_name}</TableCell>
                                <TableCell>
                                    {editingKey === configuration.config_name ? (
                                        <TextField
                                            value={configuration.config_value}
                                            onChange={(e) => handleChange(configuration.id, e.target.value)}
                                        />
                                    ) : (
                                        configuration.config_value
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editingKey === configuration.config_name ? (
                                        <Button onClick={() => handleSave(configuration)}>Save</Button>
                                    ) : (
                                        <IconButton onClick={() => handleEdit(configuration.config_name)}>
                                            <EditIcon />
                                        </IconButton>
                                    )}
                                    <IconButton onClick={() => handleDelete(configuration.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Button
                startIcon={<AddIcon />}
                onClick={() => setIsAddDialogOpen(true)}
                style={{ marginTop: '20px' }}
            >
                Add New Configuration
            </Button>

            <Dialog open={isAddDialogOpen} onClose={() => setIsAddDialogOpen(false)}>
                <DialogTitle>Add New Configuration</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Key"
                        fullWidth
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                    />
                    <TextField
                        margin="dense"
                        label="Value"
                        fullWidth
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAdd}>Add</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default ConfigurationManager;