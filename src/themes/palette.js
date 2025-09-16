// material-ui
import { createTheme } from '@mui/material/styles';

// third-party
import { presetPalettes } from '@ant-design/colors';

// project import
import ThemeOption from './theme';

// ==============================|| DEFAULT THEME - PALETTE ||============================== //

export default function Palette(mode, presetColor) {
  const colors = presetPalettes;

  let greyPrimary = [
    '#ffffff',
    '#fafafa',
    '#f5f5f5',
    '#f0f0f0',
    '#d9d9d9',
    '#bfbfbf',
    '#8c8c8c',
    '#595959',
    '#262626',
    '#141414',
    '#000000'
  ];
  let greyAscent = ['#fafafa', '#bfbfbf', '#434343', '#1f1f1f'];
  let greyConstant = ['#fafafb', '#e6ebf1'];

  colors.grey = [...greyPrimary, ...greyAscent, ...greyConstant];

  const paletteColor = ThemeOption(colors, presetColor, mode);

  const darkMode = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      common: {
        black: '#000',
        white: '#fff'
      },
      ...paletteColor,
      text: {
        primary: darkMode ? paletteColor.grey[100] : paletteColor.grey[700],
        secondary: darkMode ? paletteColor.grey[300] : paletteColor.grey[500],
        disabled: darkMode ? paletteColor.grey[600] : paletteColor.grey[400]
      },
      action: {
        disabled: darkMode ? paletteColor.grey[700] : paletteColor.grey[300]
      },
      divider: darkMode ? paletteColor.grey[800] : paletteColor.grey[200],
      background: {
        paper: darkMode ? '#1a1a1a' : paletteColor.grey[0],
        default: darkMode ? '#0f0f0f' : paletteColor.grey.A50
      }
    }
  });
}
