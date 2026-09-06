import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'nwi-theme';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

const readStoredTheme = () => {
  return 'light'; // Forced light theme
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const toggleTheme = () => {
    // Disabled toggle
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
