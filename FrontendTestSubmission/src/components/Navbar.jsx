import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { LinkOutlined, BarChart } from '@mui/icons-material';
import { useLogging } from '../context/LoggingContext';

const Navbar = () => {
  const location = useLocation();
  const { logUserInteraction } = useLogging();

  const handleNavigation = (page) => {
    logUserInteraction('click', 'navigation', { destination: page });
  };

  return (
    <AppBar 
      position="static" 
      elevation={8}
      sx={{
        background: 'linear-gradient(145deg, #1e1e2e 0%, #2a2a3e 100%)',
        borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Toolbar sx={{ py: 1 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            background: 'linear-gradient(145deg, #6366f1, #8b5cf6)',
            mr: 2,
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <LinkOutlined sx={{ fontSize: 24, color: 'white' }} />
        </Box>
        <Typography 
          variant="h5" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 700,
            background: 'linear-gradient(145deg, #ffffff, #e2e8f0)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.02em'
          }}
        >
          URL Shortener Pro
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            component={RouterLink}
            to="/"
            onClick={() => handleNavigation('shortener')}
            startIcon={<LinkOutlined />}
            sx={{
              color: 'white',
              borderRadius: 2,
              px: 3,
              py: 1,
              background: location.pathname === '/' 
                ? 'linear-gradient(145deg, #6366f1, #8b5cf6)' 
                : 'rgba(255, 255, 255, 0.05)',
              border: location.pathname === '/' 
                ? '1px solid rgba(99, 102, 241, 0.5)' 
                : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: location.pathname === '/' 
                ? '0 4px 16px rgba(99, 102, 241, 0.3)' 
                : 'none',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                background: location.pathname === '/' 
                  ? 'linear-gradient(145deg, #5855eb, #7c3aed)' 
                  : 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            Create Links
          </Button>
          <Button
            component={RouterLink}
            to="/statistics"
            onClick={() => handleNavigation('statistics')}
            startIcon={<BarChart />}
            sx={{
              color: 'white',
              borderRadius: 2,
              px: 3,
              py: 1,
              background: location.pathname === '/statistics' 
                ? 'linear-gradient(145deg, #6366f1, #8b5cf6)' 
                : 'rgba(255, 255, 255, 0.05)',
              border: location.pathname === '/statistics' 
                ? '1px solid rgba(99, 102, 241, 0.5)' 
                : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: location.pathname === '/statistics' 
                ? '0 4px 16px rgba(99, 102, 241, 0.3)' 
                : 'none',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                background: location.pathname === '/statistics' 
                  ? 'linear-gradient(145deg, #5855eb, #7c3aed)' 
                  : 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-1px)',
                boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            Analytics
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
