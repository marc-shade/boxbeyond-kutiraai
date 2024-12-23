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

function ChooseDataset({ formData, onUpdate }) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDataset, setSelectedDataset] = useState(formData.dataset || null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8200/api/v1/dataset_masters');
      if (!response.ok) throw new Error('Failed to fetch datasets');
      const data = await response.json();
      setDatasets(data);
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
        maxWidth="md"
        fullWidth
      >
        <GlassmorphicDialogTitle>Dataset Preview</GlassmorphicDialogTitle>
        <GlassmorphicDialogContent>
          {previewLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : previewData ? (
            <GlassmorphicContainer component={TableContainer} variant="card">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {Object.keys(previewData[0] || {}).map((header) => (
                      <TableCell key={header}>{header}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      {Object.values(row).map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </GlassmorphicContainer>
          ) : (
            <Typography>No preview data available</Typography>
          )}
        </GlassmorphicDialogContent>
        <GlassmorphicDialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
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
