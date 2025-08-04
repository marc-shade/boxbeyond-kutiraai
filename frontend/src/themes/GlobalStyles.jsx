import { GlobalStyles as MuiGlobalStyles } from '@mui/material';
import { useThemeSettings } from '../contexts/ThemeContext';

const GlobalStyles = () => {
  const { glassmorphismEnabled } = useThemeSettings();

  return (
    <MuiGlobalStyles styles={(theme) => ({
    body: {
      margin: 0,
      padding: 0,
      minHeight: '100vh',
      background: glassmorphismEnabled
        ? 'linear-gradient(135deg, rgba(230, 230, 250, 0.8), rgba(255, 228, 196, 0.6), rgba(230, 230, 250, 0.7))'
        : theme.palette.background.default,
      backdropFilter: glassmorphismEnabled ? 'blur(20px)' : 'none',
      color: theme.palette.text.primary,
    },
    '#root': {
      minHeight: '100vh',
    },
    // Style for the header (MUI AppBar)
    '.MuiAppBar-root': {
      background: glassmorphismEnabled
        ? 'linear-gradient(135deg, rgba(230, 230, 250, 0.9), rgba(255, 228, 196, 0.8))'
        : theme.palette.background.paper,
      backdropFilter: glassmorphismEnabled ? 'blur(10px)' : 'none',
      boxShadow: glassmorphismEnabled ? 'none' : theme.shadows[1],
    },
    // Style for the left navigation (MUI Drawer)
    '.MuiDrawer-paper': {
      background: glassmorphismEnabled
        ? 'linear-gradient(135deg, rgba(230, 230, 250, 0.95), rgba(255, 228, 196, 0.9))'
        : theme.palette.background.paper,
      backdropFilter: glassmorphismEnabled ? 'blur(12px)' : 'none',
      border: glassmorphismEnabled ? 'none' : `1px solid ${theme.palette.divider}`,
      ...(glassmorphismEnabled && {
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
      }),
      // Enhanced menu item visibility
      '& .MuiListItem-root': {
        '&:hover': {
          ...(glassmorphismEnabled && {
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(15px)',
          }),
          ...(!glassmorphismEnabled && {
            background: 'rgba(0, 0, 0, 0.04)',
          }),
        },
      },
      // Add subtle shadow for depth
      boxShadow: '0 0 15px rgba(0, 0, 0, 0.05)',
    },
    // For any glass-effect containers
    '.glass-container': {
      ...(glassmorphismEnabled && {
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
      }),
      ...(!glassmorphismEnabled && {
        background: 'rgba(0, 0, 0, 0.05)',
      }),
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

    // Keyframe animation for background (only used when glassmorphism is enabled)
    ...(glassmorphismEnabled && {
      '@keyframes gradientShift': {
        '0%': {
          backgroundPosition: '0% 50%'
        },
        '50%': {
          backgroundPosition: '100% 50%'
        },
        '100%': {
          backgroundPosition: '0% 50%'
        }
      }
    })
    })}
    />
  );
};

export default GlobalStyles;
