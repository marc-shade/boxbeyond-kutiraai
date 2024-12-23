import { alpha } from '@mui/material/styles';

export const createGlassmorphismStyles = (theme) => ({
  glassmorphism: {
    background: 'linear-gradient(135deg, rgba(230, 230, 250, 0.8), rgba(255, 228, 196, 0.6), rgba(230, 230, 250, 0.7))',
    backdropFilter: 'blur(20px)',
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${alpha(theme.palette.common.white, 0.3)}`,
    boxShadow: `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.37)}`,
    color: theme.palette.text.primary,
  },
  container: {
    background: `linear-gradient(to bottom right, 
      rgba(250, 250, 255, 0.85),  
      rgba(255, 255, 255, 0.75)   
    )`,
    backdropFilter: 'blur(15px)',
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${alpha(theme.palette.common.white, 0.5)}`,
    boxShadow: `0 4px 16px 0 ${alpha(theme.palette.common.black, 0.1)}`,
    padding: theme.spacing(3),
    color: theme.palette.text.primary,
  },
  header: {
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: 'none',
  },
  leftNav: {
    background: 'rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(10px)',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
  },

  // Updated card style for elegance
  card: {
    background: 'rgba(255, 255, 255, 0.15)', // Lighter transparency for a true glass effect
    backdropFilter: 'blur(12px)', // Slightly stronger blur for elegance
    boxShadow: '0px 6px 24px rgba(0, 0, 0, 0.2)', // Stronger shadow for better elevation
    borderRadius: '16px', // Slightly more rounded corners for a modern look
    border: '1px solid rgba(255,255,255,0.25)', // Subtle border for contrast
    overflow: 'hidden', // Ensures content stays within rounded corners
  },

  paper: {
    background: 'rgba(255, 255, 255, 0.15)', // Lighter transparency for a true glass effect
    backdropFilter: 'blur(12px)', // Slightly stronger blur for elegance
    boxShadow: '0px 6px 24px rgba(0, 0, 0, 0.2)', // Stronger shadow for better elevation
    borderRadius: '16px', // Slightly more rounded corners for a modern look
    border: '1px solid rgba(255,255,255,0.25)', // Subtle border for contrast
    overflow: 'hidden', // Ensures content stays within rounded corners
  },


  modal: {
    background: 'rgba(230, 230, 250, 0.8)', // Slightly more opaque for modals
    backdropFilter: 'blur(15px)',
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${alpha(theme.palette.common.white, 0.4)}`,
    boxShadow: `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.3)}`,
  },
});
