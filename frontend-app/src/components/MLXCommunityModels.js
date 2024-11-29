import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Container,
    Typography,
    Select,
    MenuItem,
    Card,
    CardContent,
    CardMedia,
    Box,
    CircularProgress
} from '@mui/material';

const owners = {
    items: [
        {
            'id': 'mistral',
            'slug': 'mistral-660168d3b9bcfbb875b84f37',
            'logo': '/mistral_logo.png'
        },
        {
            'id': 'llama',
            'slug': 'llama-3-662156b069a5d33b3328603c',
            'logo': '/Meta_lockup_positive primary_RGB.jpg'
        }
    ]
};

const MLXCommunityModels = ({ formData }) => {
    const [collection, setCollection] = useState(null);
    const [selectedModel, setSelectedModel] = useState(formData.selectedModel || '');
    const [selectedOwner, setSelectedOwner] = useState(formData.selectedOwner || '');
    const [selectedSlug, setSelectedSlug] = useState('');
    const [selectedOwnerLogo, setSelectedOwnerLogo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchCollection = async (slug) => {
        setLoading(true);
        try {
            const response = await axios.get(`https://huggingface.co/api/collections/mlx-community/${slug}`);
            setCollection(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch collection');
            setLoading(false);
        }
    };

    const handleModelSelect = (event) => {
        setSelectedModel(event.target.value);
        formData.selectedModel = event.target.value;
    };

    const handleOwnerSelect = (event) => {
        const selectedOwnerItem = owners.items.find(item => item.id === event.target.value);
        setSelectedOwner(selectedOwnerItem.id);
        setSelectedSlug(selectedOwnerItem.slug);
        setSelectedOwnerLogo(selectedOwnerItem.logo);
        formData.selectedModel = '';
        formData.selectedSlug = selectedOwnerItem.slug;
        formData.selectedOwner = selectedOwnerItem.id;
        fetchCollection(selectedOwnerItem.slug);
    };

    if (loading) return <CircularProgress />;
    if (error) return <Typography color="error">{error}</Typography>;

    const selectedModelData = collection?.items.find(item => item.id === selectedModel);

    return (
        <Container maxWidth="md">
            <Typography variant="h6" gutterBottom>
                Select an Owner
            </Typography>
            <Select
                value={selectedOwner}
                onChange={handleOwnerSelect}
                displayEmpty
                fullWidth
                sx={{ mb: 2 }}
            >
                <MenuItem value="" disabled>
                    Select an Owner
                </MenuItem>
                {owners.items.map((item) => (
                    <MenuItem key={item.slug} value={item.id}>
                        {item.id}
                    </MenuItem>
                ))}
            </Select>

            {collection && (
                <>
                    <Typography variant="h6" gutterBottom>
                        Select a Model
                    </Typography>
                    <Select
                        value={selectedModel}
                        onChange={handleModelSelect}
                        displayEmpty
                        fullWidth
                        sx={{ mb: 2 }}
                    >
                        <MenuItem value="" disabled>
                            Select a model
                        </MenuItem>
                        {collection.items.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                                {item.id}
                            </MenuItem>
                        ))}
                    </Select>
                </>
            )}

            {selectedModelData && (
                <Card sx={{ display: 'flex' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: '1 0 50%' }}>
                        <CardContent sx={{ flex: '1 0 auto' }}>
                            <Typography component="div" variant="h5">
                                {selectedModelData.id}
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary" component="div">
                                {selectedModelData.pipeline_tag}
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary" component="div">
                                {selectedModelData.lastModified}
                            </Typography>
                        </CardContent>
                    </Box>
                    <CardMedia
                        component="img"
                        height="150"
                        image={selectedOwnerLogo}
                        alt={selectedOwner + " Logo"}
                        sx={{ objectFit: 'contain', p: 2, flex: '0 0 25%' }}
                    />
                </Card>
            )}
        </Container>
    );
};

export default MLXCommunityModels;