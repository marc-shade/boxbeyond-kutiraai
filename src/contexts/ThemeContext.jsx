// ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useThemeSettings = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeSettings must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeSettingsProvider = ({ children }) => {
  const [glassmorphismEnabled, setGlassmorphismEnabled] = useState(() => {
    // Load from localStorage or default to false (white background)
    const saved = localStorage.getItem('glassmorphismEnabled');
    return saved !== null ? JSON.parse(saved) : false;
  });

  const [mode, setMode] = useState(() => {
    // Load theme mode from localStorage or default to light
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  useEffect(() => {
    // Save to localStorage whenever it changes
    localStorage.setItem('glassmorphismEnabled', JSON.stringify(glassmorphismEnabled));
  }, [glassmorphismEnabled]);

  useEffect(() => {
    // Save theme mode to localStorage whenever it changes
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleGlassmorphism = () => {
    setGlassmorphismEnabled(prev => !prev);
  };

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  const value = {
    glassmorphismEnabled,
    toggleGlassmorphism,
    setGlassmorphismEnabled,
    mode,
    toggleMode,
    setMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
