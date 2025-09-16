// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';

// ==============================|| LOGO - 2 ACRE STUDIOS ||============================== //

const Logo = () => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {/* Two Blue Boxes Logo */}
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {/* First Blue Box */}
        <svg width="28" height="28" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <g transform="rotate(-15 20 20)">
            {/* Front face */}
            <rect x="8" y="8" width="24" height="24" fill="#1e88e5" />
            {/* Top face */}
            <path d="M8 8 L14 2 L38 2 L32 8 Z" fill="#42a5f5" />
            {/* Right face */}
            <path d="M32 8 L38 2 L38 26 L32 32 Z" fill="#1976d2" />
          </g>
        </svg>
        
        {/* Second Blue Box */}
        <svg width="28" height="28" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <g transform="rotate(-15 20 20)">
            {/* Front face */}
            <rect x="8" y="8" width="24" height="24" fill="#1565c0" />
            {/* Top face */}
            <path d="M8 8 L14 2 L38 2 L32 8 Z" fill="#42a5f5" />
            {/* Right face */}
            <path d="M32 8 L38 2 L38 26 L32 32 Z" fill="#1976d2" />
          </g>
        </svg>
      </Box>

      {/* 2 Acre Studios Text */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: theme.palette.mode === 'dark' ? '#1e88e5' : '#1565c0',
            fontSize: '1.1rem',
            fontFamily: "'Nunito', sans-serif",
            whiteSpace: 'nowrap'
          }}
        >
          2 ACRE
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 400,
            color: theme.palette.text.primary,
            fontSize: '1.1rem',
            fontFamily: "'Nunito', sans-serif",
            whiteSpace: 'nowrap'
          }}
        >
          STUDIOS
        </Typography>
      </Box>
    </Box>
  );
};

export default Logo;
