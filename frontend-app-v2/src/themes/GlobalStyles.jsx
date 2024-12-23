import { GlobalStyles as MuiGlobalStyles } from '@mui/material';

const GlobalStyles = () => (
  <MuiGlobalStyles styles={(theme) => ({
    body: {
      margin: 0,
      padding: 0,
      minHeight: '100vh',
      background: 'linear-gradient(135deg, rgba(230, 230, 250, 0.8), rgba(255, 228, 196, 0.6), rgba(230, 230, 250, 0.7))',
      backdropFilter: 'blur(20px)',
      color: theme.palette.text.primary,
    },
    '#root': {
      minHeight: '100vh',
    },
    // Style for the header (MUI AppBar)
    '.MuiAppBar-root': {
      background: 'linear-gradient(135deg, rgba(230, 230, 250, 0.9), rgba(255, 228, 196, 0.8))',
      backdropFilter: 'blur(10px)',
      boxShadow: 'none',
    },
    // Style for the left navigation (MUI Drawer)
    '.MuiDrawer-paper': {
      background: 'linear-gradient(135deg, rgba(230, 230, 250, 0.95), rgba(255, 228, 196, 0.9))', // Increased opacity
      backdropFilter: 'blur(12px)',
      border: 'none',
      '&.MuiDrawer-docked': {
        // Styles for minimized drawer
        '& .MuiListItemIcon-root': {
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '8px',
          padding: '4px',
          margin: '4px',
          minWidth: '32px',
          display: 'flex',
          justifyContent: 'center',
        },
        '& .MuiListItemText-root': {
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '4px',
          padding: '4px 8px',
        },
      },
      // Enhanced menu item visibility
      '& .MuiListItem-root': {
        '&:hover': {
          background: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(15px)',
        },
      },
      // Add subtle shadow for depth
      boxShadow: '0 0 15px rgba(0, 0, 0, 0.05)',
    },
    // For any glass-effect containers
    '.glass-container': {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      borderRadius: '8px',
    },
    // Enhanced menu item text visibility
    '.MuiListItemText-primary': {
      color: theme.palette.text.primary,
      fontWeight: 500,
    },
    // Enhanced menu item icon visibility
    '.MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
    // Add a subtle hover effect for better interaction feedback
    '.MuiListItem-root': {
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        transform: 'translateX(4px)',
      },
    }
  })}
  />
);

export default GlobalStyles;
