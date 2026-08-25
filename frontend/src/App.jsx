import React from 'react';
import { ThemeProvider } from './theme/ThemeProvider';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-page text-ink">
        <Dashboard />
      </div>
    </ThemeProvider>
  );
}

export default App;
