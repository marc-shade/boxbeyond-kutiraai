import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { SettingOutlined, EditOutlined, PlayCircleOutlined } from '@ant-design/icons'; // Adjust imports based on your icon library
import { useNavigate } from 'react-router-dom';
import { GlassmorphicCard } from 'themes/GlassmorphicComponents';

const WorkflowCard = ({ workflow, onEdit, sx }) => {
  const navigate = useNavigate();

  return (
    <GlassmorphicCard sx={{ ...sx, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Optional: Add CardMedia if you have an image */}
      {/* <CardMedia component="img" image={media} alt="Workflow Image" /> */}

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h5" component="div">
          {workflow.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {workflow.description}
        </Typography>
      </CardContent>

      <Divider />

      {/* Toggle Button Group for additional actions */}
      <ToggleButtonGroup
        fullWidth
        color="primary"
        exclusive
        aria-label="workflow actions"
        size="small"
        sx={{
          p: 1,
          '& .MuiToggleButton-root': {
            borderRadius: 0,
            p: 0.75,
            '&:not(.Mui-selected)': {
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
            },
            '&:first-of-type': {
              borderLeftColor: 'transparent',
            },
            '&:last-of-type': {
              borderRightColor: 'transparent',
            },
            '&:hover': {
              bgcolor: 'transparent',
              color: 'primary.main',
            },
          },
        }}
      >
        <ToggleButton onClick={() => navigate(`/agentic/workflow/${workflow.id}/config`)} value="settings" aria-label="settings" disableRipple>
          <SettingOutlined />
        </ToggleButton>
        <ToggleButton value="edit" aria-label="edit" disableRipple onClick={() => onEdit(workflow)}>
          <EditOutlined />
        </ToggleButton>
        <ToggleButton onClick={() => navigate(`/agentic/workflow/${workflow.id}/execute`)} value="more" aria-label="more" disableRipple>
          <PlayCircleOutlined />
        </ToggleButton>
      </ToggleButtonGroup>
    </GlassmorphicCard>
  )
};

export default WorkflowCard;
