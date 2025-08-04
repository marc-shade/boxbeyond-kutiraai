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
    // Load from localStorage or default to true
    const saved = localStorage.getItem('glassmorphismEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    // Save to localStorage whenever it changes
    localStorage.setItem('glassmorphismEnabled', JSON.stringify(glassmorphismEnabled));
  }, [glassmorphismEnabled]);

  const toggleGlassmorphism = () => {
    setGlassmorphismEnabled(prev => !prev);
  };

  const value = {
    glassmorphismEnabled,
    toggleGlassmorphism,
    setGlassmorphismEnabled
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
