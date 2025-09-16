import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  TextField,
  InputAdornment,
  CardActionArea,
  Alert,
  Tooltip,
  IconButton,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InfoIcon from '@mui/icons-material/Info';
import StarIcon from '@mui/icons-material/Star';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { GlassmorphicContainer } from 'themes/GlassmorphicComponents';
import { determineModelType } from '../../../utils/validation';

function ChooseModel({ formData, onUpdate }) {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState(formData.baseModel || null);
  const [author, setAuthor] = useState('mlx-community'); // Default to mlx-community
  const [authorSubmitted, setAuthorSubmitted] = useState(false);
  const searchTimeout = React.useRef(null);

  // Pre-select model and set author if formData.baseModel exists (only on initial load)
  useEffect(() => {
    const initializeModel = async () => {
      if (formData.baseModel && !selectedModel) { // Only run if no model is currently selected
        // Ensure model_type is set for existing models
        const modelWithType = {
          ...formData.baseModel,
          model_type: formData.baseModel.model_type || determineModelType(formData.baseModel)
        };
        setSelectedModel(modelWithType);

        // Extract author from the model ID (assuming format: author/model-name)
        const modelId = formData.baseModel.id || '';
        const modelAuthor = modelId.includes('/') ? modelId.split('/')[0] : modelId;
        setAuthor(modelAuthor);
        setAuthorSubmitted(true);

        // Fetch models from this author to populate the list
        try {
          setLoading(true);
          const response = await fetch(
            `http://localhost:8200/api/v1/models?author=${modelAuthor}&limit=20&full=true&config=true`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );

          if (!response.ok) throw new Error('Failed to fetch models');
          const data = await response.json();
          setModels(data);

          // Ensure the selected model matches one from the fetched list
          const matchingModel = data.find(model => model.id === formData.baseModel.id);
          if (matchingModel) {
            const modelWithType = {
              ...matchingModel,
              model_type: matchingModel.model_type || determineModelType(matchingModel)
            };
            setSelectedModel(modelWithType);
          }
        } catch (err) {
          setError('Failed to load models');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    initializeModel();
  }, [formData.baseModel?.id]); // Only depend on the model ID, not the entire object

  // Auto-load mlx-community models on component mount
  useEffect(() => {
    if (!formData.baseModel && !authorSubmitted) {
      setAuthorSubmitted(true);
      fetchModels('mlx-community', '');
    }
  }, [formData.baseModel, authorSubmitted]); // Remove fetchModels from dependencies to avoid circular dependency

  const fetchModels = useCallback(async (authorName, searchTerm = '', preserveSelectedModel = null) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        author: authorName,
        limit: searchTerm ? '50' : '20', // More results when searching
        full: 'true',
        config: 'true'
      });

      // Add search parameter if provided
      if (searchTerm.trim()) {
        params.append('search', searchTerm);
      }

      const response = await fetch(
        `http://localhost:8200/api/v1/models?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();

      console.log('Fetched', data.length, 'models for query:', searchTerm || 'initial load');

      // Use the passed preserveSelectedModel or current selectedModel
      const modelToPreserve = preserveSelectedModel || selectedModel;

      // If we have a selected model that's not in the results, add it to the beginning
      if (modelToPreserve && !data.find(model => model.id === modelToPreserve.id)) {
        setModels([modelToPreserve, ...data]);
        console.log('Added selected model to results');
      } else {
        setModels(data);
      }
    } catch (err) {
      setError('Failed to load models');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAuthorSubmit = async (event) => {
    if (event.key === 'Enter' || event.type === 'click') {
      if (author.trim()) {
        setAuthorSubmitted(true);
        setSearchQuery(''); // Clear any existing search
        await fetchModels(author.trim(), ''); // Load initial models without search
      }
    }
  };

  const handleSearch = (event) => {
    const searchTerm = event.target.value;
    setSearchQuery(searchTerm);

    if (!author.trim()) return;

    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Set new timeout to debounce the search
    searchTimeout.current = setTimeout(() => {
      console.log('Searching for:', searchTerm);
      fetchModels(author.trim(), searchTerm);
    }, 500);
  };

  // Clean up timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const handleModelSelect = (model) => {
    // Add model_type to the model object based on model information
    const modelWithType = {
      ...model,
      model_type: determineModelType(model)
    };

    console.log('Model selected - ID:', modelWithType.id, 'Type:', modelWithType.model_type);

    // Set the selected model and update parent
    setSelectedModel(modelWithType);
    onUpdate(modelWithType);

    // Don't change the current search results - just update the selection
    // The selected model should remain visible in the current context
  };

  return (
    <Box>
      {/* MLX Community Info */}
      <Alert severity="info" sx={{ mb: 3, maxWidth: '800px', mx: 'auto' }}>
        <Typography variant="body2">
          <strong>Recommended:</strong> Use models from <code>mlx-community</code> for optimal performance with Apple Silicon and MLX framework.
          These models are pre-optimized and don't require special access permissions.
        </Typography>
      </Alert>

      {/* Author Search Section */}
        <Box sx={{
          display: 'flex',
          gap: 2,
          mb: 3,
          maxWidth: '800px',
          mx: 'auto',
          justifyContent: 'center'
        }}>
          <TextField
            size="small"
            sx={{ width: '300px' }}
            label="Author Name"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            onKeyPress={handleAuthorSubmit}
            placeholder="e.g., mlx-community (recommended for MLX)"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            onClick={handleAuthorSubmit}
            disabled={!author.trim() || loading}
            size="small"
          >
            Search
          </Button>
        </Box>

      {authorSubmitted && (
        <GlassmorphicContainer
          component={Box}
          variant="glassmorphism"
          container
          sx={{ mb: 3, maxWidth: '800px', mx: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}
        >
          <TextField
            size="small"
            sx={{ width: '500px', border: 'none' }}
            placeholder="Search models..."
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          {selectedModel && (
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setSelectedModel(null);
                onUpdate(null);
                console.log('Selection cleared');
              }}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              Clear Selection
            </Button>
          )}
        </GlassmorphicContainer>
      )}

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, maxWidth: '800px', mx: 'auto' }}>
          {error}
        </Alert>
      )}

      {models.length > 0 && (
        <Grid container spacing={3} sx={{ maxWidth: '1200px', mx: 'auto' }}>
          {models.map((model) => {
            const isSelected = selectedModel?.id === model.id;

            return (
              <Grid item xs={12} sm={6} md={4} key={model.id}>
                <GlassmorphicContainer
                  component={Card}
                  variant="card"
                  sx={{
                    height: '100%',
                    border: isSelected ? 2 : 1,
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    backgroundColor: isSelected ? 'primary.light' : 'transparent',
                    position: 'relative',
                  }}
                >
                <CardActionArea
                  onClick={() => handleModelSelect(model)}
                  sx={{ height: '100%' }}
                >
                  <CardContent>
                    {/* Selection indicator */}
                    {isSelected && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 1,
                        }}
                      >
                        <CheckCircleIcon color="primary" />
                      </Box>
                    )}

                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="h6" gutterBottom>
                        {model.id}
                      </Typography>
                      <Tooltip title="Model Details">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Add your info button logic here
                          }}
                        >
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Typography
                      color="textSecondary"
                      variant="body2"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {model.description || 'No description available'}
                    </Typography>

                    <Box display="flex" alignItems="center" gap={2} mb={1}>
                      <Box display="flex" alignItems="center">
                        <StarIcon sx={{ fontSize: '1rem', mr: 0.5, color: 'warning.main' }} />
                        <Typography variant="body2">
                          {model.likes || 0}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <DownloadIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
                        <Typography variant="body2">
                          {model.downloads || 0}
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" gap={1} flexWrap="wrap">
                      {model.tags?.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </GlassmorphicContainer>
            </Grid>
            );
          })}
        </Grid>
      )}

      {models.length === 0 && searchQuery && !loading && (
        <Box display="flex" justifyContent="center" p={3}>
          <Typography color="textSecondary">
            No models found matching "{searchQuery}"
          </Typography>
        </Box>
      )}

      {models.length === 0 && authorSubmitted && !loading && !searchQuery && (
        <Box display="flex" justifyContent="center" p={3}>
          <Typography color="textSecondary">
            No models found for author "{author}"
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ChooseModel;
