import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import StorageIcon from '@mui/icons-material/Storage';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import CategoryIcon from '@mui/icons-material/Category';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import FolderIcon from '@mui/icons-material/Folder';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[4],
  },
}));

const StyledCardContent = styled(CardContent)({
  flexGrow: 1,
});

const DatasetCard = ({ dataset, onLaunch, onView }) => {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'pending': return 'warning';
      case 'in-progress': return 'info';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const handleClick = () => {
    if (dataset.dataset_status === 'Pending') {
      onLaunch(dataset.id);
    } else {
      onView(dataset.id);
    }
  };

  return (
    <StyledCard>
      <StyledCardContent>
        <Typography variant="h5" component="div" gutterBottom>
          {dataset.dataset_name}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph noWrap={false}>
          {dataset.dataset_desc}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center">
              <CategoryIcon fontSize="small" color="action" />
              <Typography variant="body2" ml={1}>
                Dataset Domain: {dataset.dataset_domain}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center">
              {dataset.dataset_origin === 'local' ? <FolderOpenIcon fontSize="small" color="action" /> : <CloudUploadIcon fontSize="small" color="action" />}
              <Typography variant="body2" ml={1}>
                Dataset Origin (Local Drive or Google Drive): {dataset.dataset_origin}
              </Typography>
            </Box>
          </Grid>
          {dataset.dataset_origin === 'local' && <Grid item xs={12}>
            <Box display="flex" alignItems="center">
              <FolderIcon fontSize="small" color="action" />
              <Typography variant="body2" ml={1}>
                Dataset Location: {dataset.dataset_filepath}
              </Typography>
            </Box>
          </Grid>}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center">
              <StorageIcon fontSize="small" color="action" />
              <Typography variant="body2" ml={1}>
                Process Workflow URL: {dataset.dataset_workflow_url}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center">
              <DescriptionIcon fontSize="small" color="action" />
              <Typography variant="body2" ml={1}>
                Model Template: {dataset.dataset_model_template}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box display="flex" alignItems="center">
              <SettingsIcon fontSize="small" color="action" />
              <Typography variant="body2" ml={1}>
                System Prompt: {dataset.dataset_system_prompt}
              </Typography>
            </Box>
          </Grid>

        </Grid>
      </StyledCardContent>

      <CardActions>
        <Chip
          label={dataset.dataset_status}
          color={getStatusColor(dataset.dataset_status)}
          size="small"
        />
        <Box flexGrow={1} />
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={handleClick}
          disabled={dataset.dataset_status === 'In-Progress'}
        >
          {dataset.dataset_status === 'Pending' ? 'Launch' : 'View Details'}
        </Button>
      </CardActions>
    </StyledCard>
  );
};

export default DatasetCard;