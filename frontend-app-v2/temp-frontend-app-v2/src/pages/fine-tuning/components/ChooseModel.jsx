import React, { useState, useEffect } from 'react';
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

function ChooseModel({ formData, onUpdate }) {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModel, setSelectedModel] = useState(formData.baseModel || null);
  const [author, setAuthor] = useState('');
  const [authorSubmitted, setAuthorSubmitted] = useState(false);
  const searchTimeout = React.useRef(null);

  // Pre-select model and set author if formData.baseModel exists
  useEffect(() => {
    const initializeModel = async () => {
      if (formData.baseModel) {
        setSelectedModel(formData.baseModel);
        
        // Extract author from the model ID (assuming format: author/model-name)
        const modelAuthor = formData.baseModel.id.split('/')[0];
        setAuthor(modelAuthor);
        setAuthorSubmitted(true);

        // Fetch models from this author to populate the list
        try {
          setLoading(true);
          const HF_API_KEY = import.meta.env.VITE_HF_API_KEY;
          const response = await fetch(
            `https://huggingface.co/api/models?author=${modelAuthor}&limit=5&full=true&config=true`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${HF_API_KEY}`
              }
            }
          );

          if (!response.ok) throw new Error('Failed to fetch models');
          const data = await response.json();
          setModels(data);
        } catch (err) {
          setError('Failed to load models');
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    initializeModel();
  }, [formData.baseModel]);

  const fetchModels = async (authorName, searchTerm = '') => {
    try {
      setLoading(true);
      setError(null);

      const HF_API_KEY = import.meta.env.VITE_HF_API_KEY;

      const response = await fetch(
        `https://huggingface.co/api/models?${searchTerm ? `search=${searchTerm}&` : ''}author=${authorName}&limit=5&full=true&config=true`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${HF_API_KEY}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      setModels(data);
    } catch (err) {
      setError('Failed to load models');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorSubmit = async (event) => {
    if (event.key === 'Enter' || event.type === 'click') {
      if (author.trim()) {
        setAuthorSubmitted(true);
        await fetchModels(author.trim());
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

    // Set new timeout
    searchTimeout.current = setTimeout(() => {
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
    setSelectedModel(model);
    onUpdate(model);
  };

  return (
    <Box>
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
          placeholder="e.g., meta-llama"
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
        <Box sx={{
          mb: 3,
          maxWidth: '800px',
          mx: 'auto',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <TextField
            size="small"
            sx={{ width: '500px' }}
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
        </Box>
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
          {models.map((model) => (
            <Grid item xs={12} sm={6} md={4} key={model.id}>
              <Card sx={{
                height: '100%',
                border: (selectedModel?.id === model.id) ? 2 : 1,
                borderColor: (selectedModel?.id === model.id) ? 'primary.main' : 'divider',
              }}>
                <CardActionArea
                  onClick={(e) => handleModelSelect(model)}
                  sx={{ height: '100%' }}
                >
                  <CardContent>
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
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {models.length === 0 && authorSubmitted && !loading && (
        <Box display="flex" justifyContent="center" p={3}>
          <Typography color="textSecondary">
            No models found matching your criteria
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ChooseModel;
