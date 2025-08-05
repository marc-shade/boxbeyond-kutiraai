import { GlobalStyles as MuiGlobalStyles } from '@mui/material';

const GlobalStyles = () => {

  return (
    <MuiGlobalStyles styles={(theme) => ({
    body: {
      margin: 0,
      padding: 0,
      minHeight: '100vh',
      background: '#ffffff',
      backdropFilter: 'none',
      color: theme.palette.text.primary,
    },
    '#root': {
      minHeight: '100vh',
    },
    // Style for the header (MUI AppBar)
    '.MuiAppBar-root': {
      background: theme.palette.background.paper,
      backdropFilter: 'none',
      boxShadow: theme.shadows[1],
    },
    // Style for the left navigation (MUI Drawer)
    '.MuiDrawer-paper': {
      background: theme.palette.background.paper,
      backdropFilter: 'none',
      border: `1px solid ${theme.palette.divider}`,
      '&.MuiDrawer-docked': {
        // Styles for minimized drawer - using standard styling
        '& .MuiListItemIcon-root': {
          borderRadius: '8px',
          padding: '4px',
          margin: '4px',
          minWidth: '32px',
          display: 'flex',
          justifyContent: 'center',
        },
        '& .MuiListItemText-root': {
          borderRadius: '4px',
          padding: '4px 8px',
        },
      },
      // Enhanced menu item visibility
      '& .MuiListItem-root': {
        '&:hover': {
          background: 'rgba(0, 0, 0, 0.04)',
        },
      },
      // Add subtle shadow for depth
      boxShadow: '0 0 15px rgba(0, 0, 0, 0.05)',
    },
    // For any glass-effect containers
    '.glass-container': {
      background: 'rgba(0, 0, 0, 0.05)',
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
    },


    })}
    />
  );
};

export default GlobalStyles;
