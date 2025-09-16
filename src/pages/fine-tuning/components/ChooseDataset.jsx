// components/ChooseDataset.jsx
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PreviewIcon from '@mui/icons-material/Preview';
import {
  GlassmorphicContainer, GlassmorphicDialog,
  GlassmorphicDialogTitle,
  GlassmorphicDialogContent,
  GlassmorphicDialogActions
} from 'themes/GlassmorphicComponents';
import { useThemeSettings } from 'contexts/ThemeContext';

function ChooseDataset({ formData, onUpdate }) {
  const { glassmorphismEnabled } = useThemeSettings();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDataset, setSelectedDataset] = useState(formData.dataset || null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [expandedContent, setExpandedContent] = useState(null);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8200/api/v1/dataset_masters');
      if (!response.ok) throw new Error('Failed to fetch datasets');
      const data = await response.json();

      // Fetch record counts and sizes for each dataset
      const datasetsWithStats = await Promise.all(
        data.map(async (dataset) => {
          try {
            const outputResponse = await fetch(`http://localhost:8200/api/v1/dataset_outputs/dataset/${dataset.id}`);
            if (outputResponse.ok) {
              const outputs = await outputResponse.json();
              const recordCount = outputs.length;
              const totalSize = outputs.reduce((sum, output) => {
                const textSize = (output.chunk_text || '').length + (output.jsonl_content || '').length;
                return sum + textSize;
              }, 0);

              return {
                ...dataset,
                recordCount,
                size: totalSize
              };
            }
            return { ...dataset, recordCount: 0, size: 0 };
          } catch (err) {
            console.error(`Failed to fetch stats for dataset ${dataset.id}:`, err);
            return { ...dataset, recordCount: 0, size: 0 };
          }
        })
      );

      setDatasets(datasetsWithStats);
    } catch (err) {
      setError('Failed to load available datasets');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDatasetSelect = (dataset) => {
    setSelectedDataset(dataset);
    onUpdate(dataset);
  };

  const handlePreviewClick = async (dataset, event) => {
    event.stopPropagation();
    try {
      setPreviewLoading(true);
      setPreviewOpen(true);
      setSelectedRow(null);
      setExpandedContent(null);
      const response = await fetch(`http://localhost:8200/api/v1/dataset_outputs/dataset/${dataset.id}`);
      if (!response.ok) throw new Error('Failed to fetch preview');
      const data = await response.json();
      setPreviewData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleRowClick = (row, index) => {
    if (selectedRow === index) {
      setSelectedRow(null);
      setExpandedContent(null);
    } else {
      setSelectedRow(index);
      setExpandedContent(row);
    }
  };

  const filteredDatasets = datasets.filter(dataset =>
    dataset.name?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
    (dataset.description || '').toLowerCase().includes(searchQuery?.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Search Bar */}
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search datasets..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Datasets Grid */}
      <Grid container spacing={3}>
        {filteredDatasets.map((dataset) => (
          <Grid item xs={12} sm={6} md={4} key={dataset.id}>
            <GlassmorphicContainer
              component={Card}
              variant="card"
              sx={{
                height: '100%',
                border: selectedDataset?.id === dataset.id ? 2 : 1,
                borderColor: selectedDataset?.id === dataset.id ? 'primary.main' : 'divider',
              }}
            >
              <CardActionArea
                onClick={() => handleDatasetSelect(dataset)}
                sx={{ height: '100%' }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {dataset.dataset_name}
                  </Typography>

                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    {dataset.dataset_desc || 'No description available'}
                  </Typography>

                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Chip
                      label={`${dataset.recordCount || 0} records`}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                      label={formatFileSize(dataset.size || 0)}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                    <Chip
                      label={dataset.dataset_status}
                      color={dataset.dataset_status === 'Success' ? 'success' : 'warning'}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  </Box>

                  <Button
                    size="small"
                    startIcon={<PreviewIcon />}
                    onClick={(e) => handlePreviewClick(dataset, e)}
                  >
                    Preview Data
                  </Button>
                </CardContent>
              </CardActionArea>
            </GlassmorphicContainer>
          </Grid>
        ))}
      </Grid>

      {/* Preview Dialog */}
      <GlassmorphicDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            width: '90vw',
            maxWidth: '1200px',
            height: '85vh',
            maxHeight: '900px'
          }
        }}
      >
        <GlassmorphicDialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5">Dataset Preview</Typography>
            {previewData && (
              <Chip
                label={`${previewData.length} samples`}
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        </GlassmorphicDialogTitle>
        <GlassmorphicDialogContent sx={{ p: 0 }}>
          {previewLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress size={60} />
            </Box>
          ) : previewData && previewData.length > 0 ? (
            <Box sx={{ height: '100%', overflow: 'hidden' }}>
              {/* Sample Navigation */}
              <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" gutterBottom>
                  Training Samples
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Click on any sample below to view its full content
                </Typography>
              </Box>

              {/* Samples List */}
              <Box sx={{
                height: 'calc(100% - 120px)',
                overflow: 'auto',
                p: 2
              }}>
                <Grid container spacing={2}>
                  {previewData.map((sample, index) => (
                    <Grid item xs={12} key={index}>
                      <GlassmorphicContainer
                        component={Card}
                        variant="card"
                        sx={{
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          border: selectedRow === index ? 2 : 1,
                          borderColor: selectedRow === index ? 'primary.main' : 'divider',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 3
                          }
                        }}
                        onClick={() => handleRowClick(sample, index)}
                      >
                        <CardContent sx={{ p: 3 }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                            <Typography variant="h6" color="primary">
                              Sample #{index + 1}
                            </Typography>
                            <Box display="flex" gap={1}>
                              {sample.filename && (
                                <Chip
                                  label={sample.filename}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                              <Chip
                                label={selectedRow === index ? "Click to collapse" : "Click to expand"}
                                size="small"
                                color={selectedRow === index ? "secondary" : "default"}
                              />
                            </Box>
                          </Box>

                          {/* Preview of content */}
                          <Box sx={{ mb: 2 }}>
                            {sample.chunk_text && (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                  Content Preview:
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                                    p: 2,
                                    borderRadius: 1,
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                    lineHeight: 1.5,
                                    maxHeight: selectedRow === index ? 'none' : '100px',
                                    overflow: selectedRow === index ? 'visible' : 'hidden',
                                    position: 'relative'
                                  }}
                                >
                                  {selectedRow === index
                                    ? sample.chunk_text
                                    : `${sample.chunk_text.substring(0, 200)}${sample.chunk_text.length > 200 ? '...' : ''}`
                                  }
                                </Typography>
                              </Box>
                            )}

                            {sample.jsonl_content && selectedRow === index && (
                              <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                  Training Format:
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    backgroundColor: 'rgba(25, 118, 210, 0.05)',
                                    p: 2,
                                    borderRadius: 1,
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                    whiteSpace: 'pre-wrap',
                                    border: '1px solid',
                                    borderColor: 'primary.light'
                                  }}
                                >
                                  {sample.jsonl_content}
                                </Typography>
                              </Box>
                            )}
                          </Box>

                          {/* Metadata */}
                          {selectedRow === index && (
                            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                                Metadata:
                              </Typography>
                              <Grid container spacing={2}>
                                {Object.entries(sample).map(([key, value]) => {
                                  if (key === 'chunk_text' || key === 'jsonl_content') return null;
                                  return (
                                    <Grid item xs={6} sm={4} key={key}>
                                      <Box>
                                        <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'capitalize' }}>
                                          {key.replace('_', ' ')}:
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                          {value || 'N/A'}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                  );
                                })}
                              </Grid>
                            </Box>
                          )}
                        </CardContent>
                      </GlassmorphicContainer>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="400px">
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No preview data available
              </Typography>
              <Typography variant="body2" color="textSecondary">
                This dataset might be empty or the preview could not be loaded.
              </Typography>
            </Box>
          )}
        </GlassmorphicDialogContent>
        <GlassmorphicDialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => {
              setPreviewOpen(false);
              setSelectedRow(null);
              setExpandedContent(null);
            }}
            variant="contained"
            size="large"
          >
            Close
          </Button>
        </GlassmorphicDialogActions>
      </GlassmorphicDialog>

      {filteredDatasets.length === 0 && (
        <Box display="flex" justifyContent="center" p={3}>
          <Typography color="textSecondary">
            No datasets found matching your search criteria
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default ChooseDataset;
