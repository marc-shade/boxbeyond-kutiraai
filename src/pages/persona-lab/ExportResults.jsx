import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Avatar,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Divider
} from '@mui/material';
import {
  Download as DownloadIcon,
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  Code as JsonIcon,
  Assessment as ReportIcon,
  Check as CheckIcon,
  CloudDownload as CloudDownloadIcon,
  Email as EmailIcon,
  Share as ShareIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { GlassmorphicCard } from 'themes/GlassmorphicComponents';

// ==============================|| EXPORT RESULTS ||============================== //

export default function ExportResults({ personas = [], experiments = [] }) {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [selectedContent, setSelectedContent] = useState({
    personas: true,
    experiments: true,
    analytics: true,
    insights: true,
    comparisons: false,
    rawData: false
  });
  const [exportDialog, setExportDialog] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const exportFormats = [
    { value: 'pdf', label: 'PDF Report', icon: <PdfIcon />, description: 'Comprehensive formatted report with charts' },
    { value: 'csv', label: 'CSV Data', icon: <CsvIcon />, description: 'Spreadsheet-compatible data export' },
    { value: 'json', label: 'JSON', icon: <JsonIcon />, description: 'Complete data in JSON format' },
    { value: 'pptx', label: 'PowerPoint', icon: <ReportIcon />, description: 'Presentation-ready slides' }
  ];

  const handleExport = () => {
    setExportDialog(true);
  };

  const performExport = () => {
    setExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      setExporting(false);
      setExportComplete(true);
      
      // Create download based on format
      const filename = `persona-lab-export-${Date.now()}.${exportFormat}`;
      const data = generateExportData();
      downloadFile(data, filename, exportFormat);
      
      setTimeout(() => {
        setExportDialog(false);
        setExportComplete(false);
      }, 2000);
    }, 2000);
  };

  const generateExportData = () => {
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        format: exportFormat,
        version: '1.0.0'
      },
      content: {}
    };

    if (selectedContent.personas) {
      exportData.content.personas = personas.map(p => ({
        id: p.id,
        name: p.name,
        demographic: p.demographic,
        psychographic: p.psychographic,
        goals: p.goals,
        painPoints: p.painPoints,
        behaviors: p.behaviors
      }));
    }

    if (selectedContent.experiments) {
      exportData.content.experiments = experiments.map(e => ({
        id: e.id,
        name: e.name,
        status: e.status,
        startDate: e.startDate,
        endDate: e.endDate,
        targetPersonas: e.targetPersonas,
        scenarios: e.scenarios,
        results: e.results
      }));
    }

    if (selectedContent.analytics) {
      exportData.content.analytics = {
        totalPersonas: personas.length,
        totalExperiments: experiments.length,
        completedExperiments: experiments.filter(e => e.status === 'completed').length,
        avgEngagementRate: '85%',
        topPerformingPersonas: personas.slice(0, 3).map(p => p.name),
        keyInsights: generateInsights()
      };
    }

    if (selectedContent.insights) {
      exportData.content.insights = generateInsights();
    }

    if (selectedContent.comparisons) {
      exportData.content.comparisons = generateComparisons();
    }

    if (selectedContent.rawData) {
      exportData.content.rawData = {
        personas,
        experiments
      };
    }

    return exportData;
  };

  const generateInsights = () => {
    return [
      'Tech Early Adopters show 35% higher engagement with AI features',
      'Price sensitivity increases significantly above $99 price point',
      'Millennials respond 2x better to social proof messaging',
      'Personalized demos increase conversion by 45% for Enterprise personas',
      'Mobile-first approach critical for Gen Z segment'
    ];
  };

  const generateComparisons = () => {
    return {
      personaComparisons: [
        { personas: ['Tech Enthusiast', 'Early Adopter'], similarity: 0.85 },
        { personas: ['Price Conscious', 'Value Seeker'], similarity: 0.92 }
      ],
      segmentAnalysis: {
        mostEngaged: 'Millennials',
        highestConversion: 'Enterprise',
        bestRetention: 'Brand Loyalists'
      }
    };
  };

  const downloadFile = (data, filename, format) => {
    let content, mimeType;
    
    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        break;
      case 'csv':
        content = convertToCSV(data);
        mimeType = 'text/csv';
        break;
      case 'pdf':
        // In real implementation, would use a PDF library
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/pdf';
        break;
      case 'pptx':
        // In real implementation, would use a PowerPoint library
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        break;
      default:
        content = JSON.stringify(data, null, 2);
        mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data) => {
    // Simple CSV conversion for demo
    const headers = ['Type', 'Name', 'Value'];
    const rows = [];
    
    if (data.content.personas) {
      data.content.personas.forEach(p => {
        rows.push(['Persona', p.name, p.demographic]);
      });
    }
    
    if (data.content.experiments) {
      data.content.experiments.forEach(e => {
        rows.push(['Experiment', e.name, e.status]);
      });
    }
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const handleContentToggle = (key) => {
    setSelectedContent(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getSelectedCount = () => {
    return Object.values(selectedContent).filter(v => v).length;
  };

  return (
    <>
      <GlassmorphicCard>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                <FileDownloadIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Export Results
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Download your persona lab data and insights
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Quick Export Options */}
          <Typography variant="h6" gutterBottom>
            Quick Export
          </Typography>
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<PdfIcon />}
              onClick={() => {
                setExportFormat('pdf');
                handleExport();
              }}
            >
              Export PDF Report
            </Button>
            <Button
              variant="outlined"
              startIcon={<CsvIcon />}
              onClick={() => {
                setExportFormat('csv');
                handleExport();
              }}
            >
              Export to CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<JsonIcon />}
              onClick={() => {
                setExportFormat('json');
                handleExport();
              }}
            >
              Export as JSON
            </Button>
            <Button
              variant="outlined"
              startIcon={<EmailIcon />}
              disabled
            >
              Email Report
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Custom Export */}
          <Typography variant="h6" gutterBottom>
            Custom Export
          </Typography>
          
          <Paper variant="outlined" sx={{ p: 3 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                label="Export Format"
              >
                {exportFormats.map((format) => (
                  <MenuItem key={format.value} value={format.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {format.icon}
                      <Box>
                        <Typography variant="body2">{format.label}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          {format.description}
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Typography variant="subtitle2" gutterBottom>
              Select Content to Export
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={selectedContent.personas}
                    onChange={() => handleContentToggle('personas')}
                  />
                }
                label={`Personas (${personas.length})`}
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={selectedContent.experiments}
                    onChange={() => handleContentToggle('experiments')}
                  />
                }
                label={`Experiments (${experiments.length})`}
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={selectedContent.analytics}
                    onChange={() => handleContentToggle('analytics')}
                  />
                }
                label="Analytics & Metrics"
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={selectedContent.insights}
                    onChange={() => handleContentToggle('insights')}
                  />
                }
                label="Key Insights"
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={selectedContent.comparisons}
                    onChange={() => handleContentToggle('comparisons')}
                  />
                }
                label="Persona Comparisons"
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={selectedContent.rawData}
                    onChange={() => handleContentToggle('rawData')}
                  />
                }
                label="Raw Data"
              />
            </FormGroup>

            <Box mt={3}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                disabled={getSelectedCount() === 0}
                fullWidth
              >
                Export {getSelectedCount()} Selected Items
              </Button>
            </Box>
          </Paper>

          {/* Recent Exports */}
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Recent Exports
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <PdfIcon color="error" />
                </ListItemIcon>
                <ListItemText
                  primary="Monthly Report - November 2024"
                  secondary="Exported 2 days ago • 2.4 MB"
                />
                <Button size="small" startIcon={<CloudDownloadIcon />}>
                  Re-download
                </Button>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CsvIcon color="success" />
                </ListItemIcon>
                <ListItemText
                  primary="Persona Data Export"
                  secondary="Exported 5 days ago • 156 KB"
                />
                <Button size="small" startIcon={<CloudDownloadIcon />}>
                  Re-download
                </Button>
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <JsonIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="API Integration Export"
                  secondary="Exported 1 week ago • 89 KB"
                />
                <Button size="small" startIcon={<CloudDownloadIcon />}>
                  Re-download
                </Button>
              </ListItem>
            </List>
          </Box>
        </CardContent>
      </GlassmorphicCard>

      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => !exporting && setExportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {exporting ? 'Exporting Data...' : exportComplete ? 'Export Complete!' : 'Confirm Export'}
        </DialogTitle>
        <DialogContent>
          {exporting && (
            <Box py={3}>
              <LinearProgress />
              <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 2 }}>
                Preparing your {exportFormat.toUpperCase()} export...
              </Typography>
            </Box>
          )}
          
          {exportComplete && (
            <Box py={3} textAlign="center">
              <Avatar sx={{ bgcolor: 'success.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
                <CheckIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6" gutterBottom>
                Export Successful!
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Your file has been downloaded
              </Typography>
            </Box>
          )}
          
          {!exporting && !exportComplete && (
            <Box py={2}>
              <Alert severity="info" sx={{ mb: 2 }}>
                You're about to export {getSelectedCount()} data sections as {exportFormat.toUpperCase()}
              </Alert>
              
              <Typography variant="subtitle2" gutterBottom>
                Export Summary:
              </Typography>
              <List dense>
                {Object.entries(selectedContent).filter(([_, v]) => v).map(([key, _]) => (
                  <ListItem key={key}>
                    <ListItemIcon>
                      <CheckIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={key.charAt(0).toUpperCase() + key.slice(1)}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        {!exporting && !exportComplete && (
          <DialogActions>
            <Button onClick={() => setExportDialog(false)}>Cancel</Button>
            <Button onClick={performExport} variant="contained" startIcon={<DownloadIcon />}>
              Export Now
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
}