import { alpha } from '@mui/material/styles';

export const createGlassmorphismStyles = (theme) => ({
  glassmorphism: {
    background: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[1],
    color: theme.palette.text.primary,
  },
  container: {
    background: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[1],
    padding: theme.spacing(3),
    color: theme.palette.text.primary,
  },
  header: {
    background: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[1],
  },
  leftNav: {
    background: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[1],
  },

  // Updated card style for elegance
  card: {
    background: theme.palette.background.paper,
    boxShadow: theme.shadows[1],
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    overflow: 'hidden',
    transition: 'all 0.3s ease-in-out',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4],
    }
  },

  paper: {
    background: theme.palette.background.paper,
    boxShadow: theme.shadows[1],
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    overflow: 'hidden',
  },


  modal: {
    background: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[8],
  },

  // Navigation item enhancement
  navItem: {
    background: 'transparent',
    borderRadius: theme.shape.borderRadius,
    border: `1px solid transparent`,
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      background: 'rgba(0, 0, 0, 0.04)',
      transform: 'translateX(4px)',
      boxShadow: theme.shadows[1],
    },
    '&.Mui-selected': {
      background: theme.palette.action.selected,
      borderColor: theme.palette.primary.main,
      boxShadow: theme.shadows[1],
    }
  },

  // Default variant
  default: {
    background: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
  },
});
