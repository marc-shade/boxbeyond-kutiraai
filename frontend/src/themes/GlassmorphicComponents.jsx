// GlassmorphicComponents.js
import React from 'react';
import { styled } from '@mui/material/styles';
import { Dialog, DialogTitle, DialogContent, DialogActions, Card, AppBar, Grid, Paper, Box, Drawer } from '@mui/material';
import { createGlassmorphismStyles } from './GlassmorphismStyles';
import { useTheme } from '@mui/material/styles';
import { useThemeSettings } from '../contexts/ThemeContext';

// GlassmorphicContainer component
export const GlassmorphicContainer = React.forwardRef(({ component: Component = 'div', variant = 'default', ...props }, ref) => {
    const theme = useTheme(); // Access the theme using MUI's hook
    const { glassmorphismEnabled } = useThemeSettings(); // Get glassmorphism setting
    const glassmorphismStyles = createGlassmorphismStyles(theme); // Pass the theme to your styles function

    // Create default styles for when glassmorphism is disabled
    const defaultStyles = {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: theme.shape.borderRadius,
      boxShadow: theme.shadows[1]
    };

    return (
      <Component
        ref={ref}
        {...props}
        sx={{
          ...(glassmorphismEnabled ? glassmorphismStyles[variant] : defaultStyles), // Apply glassmorphism or default styles
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
))({});

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
))({});

// Define the GlassmorphicBox component
export const GlassmorphicBox = styled((props) => (
  <GlassmorphicContainer component={Box} variant="default" {...props} />
))({
  // You can add any additional styles here if needed
});
