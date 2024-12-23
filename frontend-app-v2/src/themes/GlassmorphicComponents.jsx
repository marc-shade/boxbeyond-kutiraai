// GlassmorphicComponents.js
import React from 'react';
import { styled } from '@mui/material/styles';
import { Dialog, DialogTitle, DialogContent, DialogActions, Card, AppBar, Grid, Paper, Box } from '@mui/material';
import { createGlassmorphismStyles } from './GlassmorphismStyles';
import { useTheme } from '@mui/material/styles';

// GlassmorphicContainer component
export const GlassmorphicContainer = React.forwardRef(({ component: Component = 'div', variant = 'default', ...props }, ref) => {
    const theme = useTheme(); // Access the theme using MUI's hook
    const glassmorphismStyles = createGlassmorphismStyles(theme); // Pass the theme to your styles function
  
    return (
      <Component
        ref={ref}
        {...props}
        sx={{
          ...glassmorphismStyles[variant], // Apply glassmorphism styles based on variant
          ...props.sx, // Allow additional styles passed via props
        }}
      />
    );
  });
  
// Glassmorphic versions of MUI components
export const GlassmorphicCard = styled((props) => (
  <GlassmorphicContainer component={Card} variant="card" {...props} />
))({});

export const GlassmorphicAppBar = styled((props) => (
  <GlassmorphicContainer component={AppBar} variant="header" {...props} />
))({});

export const GlassmorphicDrawer = styled((props) => (
  <GlassmorphicContainer component={Drawer} variant="leftNav" {...props} />
))({});

export const GlassmorphicGrid = styled((props) => (
  <GlassmorphicContainer component={Grid} variant="glassmorphism" {...props} />
))({});

export const GlassmorphicPaper = styled((props) => (
  <GlassmorphicContainer component={Paper} variant="paper" {...props} />
))({});

// Dialog components (as before)
export const GlassmorphicDialog = styled((props) => (
  <GlassmorphicContainer component={Dialog} variant="modal" {...props} />
))({
  '& .MuiDialog-paper': {
    width: '500px',
    maxWidth: '90vw',
  },
});

export const GlassmorphicDialogTitle = styled((props) => (
  <GlassmorphicContainer component={DialogTitle} variant="modal" {...props} />
))({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
});

export const GlassmorphicDialogContent = styled((props) => (
  <GlassmorphicContainer component={DialogContent} variant="modal" {...props} />
))({
  width: '500px',
  '& .MuiTextField-root': {
    marginBottom: (theme) => theme.spacing(2),
  },
});

export const GlassmorphicDialogActions = styled((props) => (
  <GlassmorphicContainer component={DialogActions} variant="modal" {...props} />
))({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
});

// Define the GlassmorphicBox component
export const GlassmorphicBox = styled((props) => (
  <GlassmorphicContainer component={Box} variant="default" {...props} />
))({
  // You can add any additional styles here if needed
});
