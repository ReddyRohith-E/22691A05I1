import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import Navbar from './components/Navbar';
import UrlShortener from './pages/UrlShortener';
import Statistics from './pages/Statistics';
import { LoggingProvider } from './context/LoggingContext';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1',
      light: '#8b5cf6',
      dark: '#4338ca',
    },
    secondary: {
      main: '#8b5cf6',
      light: '#a855f7',
      dark: '#7c3aed',
    },
    background: {
      default: '#0f0f23',
      paper: '#1e1e2e',
    },
    surface: {
      main: '#2a2a3e',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
          minHeight: '100vh',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <LoggingProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
              <Routes>
                <Route path="/" element={<UrlShortener />} />
                <Route path="/statistics" element={<Statistics />} />
              </Routes>
            </Container>
          </div>
        </Router>
      </LoggingProvider>
    </ThemeProvider>
  );
}

export default App;
