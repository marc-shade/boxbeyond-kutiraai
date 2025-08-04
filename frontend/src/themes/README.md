# Glassmorphism Theme Implementation

This theme includes glass morphism effects that can be applied to various MUI components. The implementation provides a modern, translucent glass-like appearance to your UI elements.

## Usage

### Cards
Cards automatically have the glass effect applied:
```jsx
import { Card } from '@mui/material';

<Card>
  {/* Card content */}
</Card>
```

### Papers and Other Components
Add the `glass` class to apply the effect:
```jsx
import { Paper, AppBar } from '@mui/material';

<Paper className="glass">
  {/* Content */}
</Paper>

<AppBar className="glass" position="fixed">
  {/* App bar content */}
</AppBar>
```

## Customization

The glass effect properties can be customized in `themes/overrides/Glass.js`. The default values are:

- Blur: 10px
- Background: rgba(255, 255, 255, 0.1)
- Border: 1px solid rgba(255, 255, 255, 0.18)
- Border Radius: 16px
- Box Shadow: 0 4px 30px rgba(0, 0, 0, 0.1)

You can adjust these values to match your design requirements.