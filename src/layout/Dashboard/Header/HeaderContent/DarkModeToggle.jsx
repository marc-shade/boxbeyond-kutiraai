import { IconButton, Tooltip } from '@mui/material';
import { useThemeSettings } from '../../../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

// ==============================|| HEADER - DARK MODE TOGGLE ||============================== //

const DarkModeToggle = () => {
  const { mode, toggleMode } = useThemeSettings();
  const isDark = mode === 'dark';

  return (
    <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
      <IconButton
        color="inherit"
        onClick={toggleMode}
        sx={{
          color: 'text.primary',
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            transform: 'rotate(180deg)'
          }
        }}
      >
        {isDark ? (
          <Sun size={20} style={{ color: '#ffa726' }} />
        ) : (
          <Moon size={20} style={{ color: '#1976d2' }} />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default DarkModeToggle;