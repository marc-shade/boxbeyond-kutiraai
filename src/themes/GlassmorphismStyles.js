import { alpha } from '@mui/material/styles';

export const createGlassmorphismStyles = (theme) => {
  const isDark = theme.palette.mode === 'dark';
  
  return {
    glassmorphism: {
      background: isDark ? 
        'rgba(26, 26, 26, 0.85)' : 
        'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: theme.shape.borderRadius,
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      boxShadow: isDark ? 
        '0 8px 32px rgba(0, 0, 0, 0.3)' :
        '0 8px 32px rgba(0, 0, 0, 0.1)',
      color: theme.palette.text.primary,
    },
    container: {
      background: isDark ? 
        'rgba(26, 26, 26, 0.85)' : 
        'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: theme.shape.borderRadius,
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      boxShadow: isDark ? 
        '0 8px 32px rgba(0, 0, 0, 0.3)' :
        '0 8px 32px rgba(0, 0, 0, 0.1)',
      padding: theme.spacing(3),
      color: theme.palette.text.primary,
    },
    header: {
      background: isDark ? 
        'rgba(26, 26, 26, 0.90)' : 
        'rgba(255, 255, 255, 0.90)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      boxShadow: isDark ? 
        '0 2px 16px rgba(0, 0, 0, 0.3)' :
        '0 2px 16px rgba(0, 0, 0, 0.1)',
    },
    leftNav: {
      background: isDark ? 
        'rgba(26, 26, 26, 0.90)' : 
        'rgba(255, 255, 255, 0.90)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRight: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      boxShadow: isDark ? 
        '2px 0 16px rgba(0, 0, 0, 0.3)' :
        '2px 0 16px rgba(0, 0, 0, 0.1)',
    },

    // Updated card style for elegance
    card: {
      background: isDark ? 
        'rgba(26, 26, 26, 0.85)' : 
        'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: isDark ? 
        '0 8px 32px rgba(0, 0, 0, 0.3)' :
        '0 8px 32px rgba(0, 0, 0, 0.1)',
      borderRadius: theme.shape.borderRadius,
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      overflow: 'hidden',
      transition: 'all 0.3s ease-in-out',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: isDark ? 
          '0 12px 40px rgba(0, 0, 0, 0.4)' :
          '0 12px 40px rgba(0, 0, 0, 0.15)',
        background: isDark ? 
          'rgba(26, 26, 26, 0.95)' : 
          'rgba(255, 255, 255, 0.95)',
      }
    },

    paper: {
      background: isDark ? 
        'rgba(26, 26, 26, 0.85)' : 
        'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: isDark ? 
        '0 8px 32px rgba(0, 0, 0, 0.3)' :
        '0 8px 32px rgba(0, 0, 0, 0.1)',
      borderRadius: theme.shape.borderRadius,
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      overflow: 'hidden',
    },

    modal: {
      background: isDark ? 
        'rgba(26, 26, 26, 0.95)' : 
        'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: theme.shape.borderRadius,
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
      boxShadow: isDark ? 
        '0 16px 64px rgba(0, 0, 0, 0.5)' :
        '0 16px 64px rgba(0, 0, 0, 0.2)',
    },

    // Navigation item enhancement
    navItem: {
      background: 'transparent',
      borderRadius: theme.shape.borderRadius,
      border: `1px solid transparent`,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        background: isDark ? 
          'rgba(255, 255, 255, 0.05)' : 
          'rgba(0, 0, 0, 0.04)',
        transform: 'translateX(4px)',
        boxShadow: isDark ? 
          '0 4px 16px rgba(0, 0, 0, 0.3)' :
          '0 4px 16px rgba(0, 0, 0, 0.1)',
      },
      '&.Mui-selected': {
        background: theme.palette.action.selected,
        borderColor: theme.palette.primary.main,
        boxShadow: isDark ? 
          '0 4px 16px rgba(0, 0, 0, 0.3)' :
          '0 4px 16px rgba(0, 0, 0, 0.1)',
      }
    },

    // Default variant
    default: {
      background: isDark ? 
        'rgba(26, 26, 26, 0.85)' : 
        'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: theme.shape.borderRadius,
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    },
  };
};
