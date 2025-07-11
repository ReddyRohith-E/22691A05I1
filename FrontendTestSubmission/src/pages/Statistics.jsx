import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Alert,
  Snackbar,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  ContentCopy as CopyIcon,
  Search as SearchIcon,
  Timeline as TimelineIcon,
  Language as LanguageIcon,
  Computer as ComputerIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { useLogging } from '../context/LoggingContext';
import { getUrlStatistics } from '../services/apiService';
import { formatDate, getTimeAgo, copyToClipboard, extractDomain, getExpiryStatus } from '../utils/helpers';

const Statistics = () => {
  const { logPageView, logApiCall, logUserInteraction } = useLogging();
  
  const [shortcode, setShortcode] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [searchHistory, setSearchHistory] = useState([]);

  useEffect(() => {
    logPageView('statistics');
    
    const savedHistory = JSON.parse(sessionStorage.getItem('searchHistory') || '[]');
    setSearchHistory(savedHistory);
  }, [logPageView]);

  const fetchStatistics = async () => {
    if (!shortcode.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a shortcode',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    setError(null);
    
    logUserInteraction('click', 'fetch-statistics', { shortcode });

    try {
      const startTime = Date.now();
      const result = await getUrlStatistics(shortcode.trim());
      const responseTime = Date.now() - startTime;

      logApiCall('GET', `/shorturls/${shortcode}`, result.success ? 200 : 'error', responseTime);

      if (result.success) {
        setStatistics(result.data);
        
        const newHistoryItem = {
          shortcode: shortcode.trim(),
          timestamp: new Date().toISOString(),
          totalClicks: result.data.totalClicks
        };
        
        const updatedHistory = [newHistoryItem, ...searchHistory.filter(item => item.shortcode !== shortcode.trim())].slice(0, 10);
        setSearchHistory(updatedHistory);
        sessionStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
        
        setSnackbar({
          open: true,
          message: 'Statistics loaded successfully',
          severity: 'success'
        });
      } else {
        setError(result.error.message || 'Failed to fetch statistics');
        setStatistics(null);
        setSnackbar({
          open: true,
          message: result.error.message || 'Failed to fetch statistics',
          severity: 'error'
        });
      }
    } catch (error) {
      setError('Network error occurred');
      setStatistics(null);
      setSnackbar({
        open: true,
        message: 'Network error occurred',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (link) => {
    const success = await copyToClipboard(link);
    setSnackbar({
      open: true,
      message: success ? 'Link copied to clipboard!' : 'Failed to copy link',
      severity: success ? 'success' : 'error'
    });
    
    logUserInteraction('click', 'copy-link', { link, success });
  };

  const loadFromHistory = (historyShortcode) => {
    setShortcode(historyShortcode);
    logUserInteraction('click', 'load-from-history', { shortcode: historyShortcode });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    sessionStorage.removeItem('searchHistory');
    logUserInteraction('click', 'clear-search-history');
    setSnackbar({
      open: true,
      message: 'Search history cleared',
      severity: 'info'
    });
  };


  const getTopReferrers = (clicks) => {
    const referrerCounts = {};
    clicks.forEach(click => {
      const referrer = click.referrer === 'Direct' ? 'Direct Access' : extractDomain(click.referrer);
      referrerCounts[referrer] = (referrerCounts[referrer] || 0) + 1;
    });
    
    return Object.entries(referrerCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([referrer, count]) => ({ referrer, count }));
  };


  const getLocationDistribution = (clicks) => {
    const locationCounts = {};
    clicks.forEach(click => {
      const location = click.location || 'Unknown';
      locationCounts[location] = (locationCounts[location] || 0) + 1;
    });
    
    return Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([location, count]) => ({ location, count }));
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
      pb: 4
    }}>
      <Paper 
        elevation={8} 
        sx={{ 
          p: 4, 
          mb: 4, 
          background: 'linear-gradient(145deg, #1e1e2e 0%, #2a2a3e 100%)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: 3,
          backdropFilter: 'blur(10px)'
        }}
      >
        <Box display="flex" alignItems="center" mb={3}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(145deg, #6366f1, #8b5cf6)',
              mr: 2,
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.3)'
            }}
          >
            <BarChartIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(145deg, #ffffff, #e2e8f0)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}
          >
            URL Analytics Pro
          </Typography>
        </Box>
        
        <Typography 
          variant="h6" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.7)', 
            mb: 4,
            fontWeight: 400,
            lineHeight: 1.6
          }}
        >
          Comprehensive analytics for your shortened URLs including click tracking, referrer analysis, and geographic insights.
        </Typography>

        <Box display="flex" gap={2} mb={3}>
          <TextField
            fullWidth
            label="Enter Shortcode"
            placeholder="e.g., abc123, xyz789"
            value={shortcode}
            onChange={(e) => setShortcode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && fetchStatistics()}
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 2,
                '& fieldset': {
                  borderColor: 'rgba(99, 102, 241, 0.3)',
                  borderWidth: 2
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(99, 102, 241, 0.5)'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#6366f1',
                  boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)'
                }
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                  color: '#6366f1'
                }
              },
              '& .MuiInputBase-input': {
                color: 'white',
                fontSize: '1.1rem'
              }
            }}
          />
          <Button
            variant="contained"
            onClick={fetchStatistics}
            disabled={loading || !shortcode.trim()}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
            sx={{ 
              minWidth: 160,
              height: 56,
              borderRadius: 2,
              background: loading ? 'rgba(99, 102, 241, 0.3)' : 'linear-gradient(145deg, #6366f1, #8b5cf6)',
              boxShadow: loading ? 'none' : '0 8px 32px rgba(99, 102, 241, 0.4)',
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                background: loading ? 'rgba(99, 102, 241, 0.3)' : 'linear-gradient(145deg, #5855eb, #7c3aed)',
                boxShadow: '0 12px 40px rgba(99, 102, 241, 0.5)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {loading ? 'Analyzing...' : 'Get Analytics'}
          </Button>
        </Box>

        {searchHistory.length > 0 && (
          <Card 
            variant="outlined" 
            sx={{ 
              mb: 3,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: 2,
              backdropFilter: 'blur(10px)'
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'white',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <AccessTimeIcon sx={{ color: '#6366f1' }} />
                  Recent Searches
                </Typography>
                <Button 
                  size="small" 
                  onClick={clearHistory}
                  sx={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444'
                    }
                  }}
                >
                  Clear History
                </Button>
              </Box>
              <Box display="flex" gap={1} flexWrap="wrap">
                {searchHistory.map((item, index) => (
                  <Chip
                    key={index}
                    label={`${item.shortcode} (${item.totalClicks} clicks)`}
                    onClick={() => loadFromHistory(item.shortcode)}
                    variant="outlined"
                    size="medium"
                    clickable
                    sx={{
                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                      borderColor: 'rgba(99, 102, 241, 0.3)',
                      color: 'white',
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        borderColor: '#6366f1',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        )}
      </Paper>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 2,
            '& .MuiAlert-icon': {
              color: '#ef4444'
            },
            '& .MuiAlert-message': {
              color: 'white',
              fontSize: '1rem'
            }
          }}
        >
          {error}
        </Alert>
      )}

      {statistics && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card 
              elevation={8}
              sx={{
                background: 'linear-gradient(145deg, #1e1e2e 0%, #2a2a3e 100%)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)'
                }
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700,
                      color: 'white',
                      mr: 2
                    }}
                  >
                    {statistics.shortcode}
                  </Typography>
                  <Chip 
                    {...getExpiryStatus(statistics.expiresAt)}
                    label={getExpiryStatus(statistics.expiresAt).status}
                    color={getExpiryStatus(statistics.expiresAt).color}
                    variant="filled"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      '&.MuiChip-colorSuccess': {
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        color: '#22c55e',
                        border: '1px solid rgba(34, 197, 94, 0.3)'
                      },
                      '&.MuiChip-colorWarning': {
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.3)'
                      },
                      '&.MuiChip-colorError': {
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }
                    }}
                  />
                </Box>
                
                <Grid container spacing={4}>
                  <Grid item xs={12} md={8}>
                    <Box mb={3}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)',
                          mb: 1,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontSize: '0.75rem'
                        }}
                      >
                        Original URL
                      </Typography>
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        gap={2} 
                        p={2}
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 2,
                          border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            wordBreak: 'break-all', 
                            flexGrow: 1,
                            color: 'white',
                            fontSize: '1rem'
                          }}
                        >
                          {statistics.originalUrl}
                        </Typography>
                        <Tooltip title="Copy URL" arrow>
                          <IconButton 
                            size="small" 
                            onClick={() => handleCopyLink(statistics.originalUrl)}
                            sx={{
                              backgroundColor: 'rgba(99, 102, 241, 0.2)',
                              color: '#6366f1',
                              '&:hover': {
                                backgroundColor: 'rgba(99, 102, 241, 0.3)',
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)',
                          mb: 1,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          fontSize: '0.75rem'
                        }}
                      >
                        Short URL
                      </Typography>
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        gap={2}
                        p={2}
                        sx={{
                          backgroundColor: 'rgba(99, 102, 241, 0.1)',
                          borderRadius: 2,
                          border: '1px solid rgba(99, 102, 241, 0.3)'
                        }}
                      >
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontFamily: 'Monaco, Consolas, monospace', 
                            flexGrow: 1,
                            color: '#6366f1',
                            fontSize: '1rem',
                            fontWeight: 600
                          }}
                        >
                          http://localhost:3100/{statistics.shortcode}
                        </Typography>
                        <Tooltip title="Copy short URL" arrow>
                          <IconButton 
                            size="small" 
                            onClick={() => handleCopyLink(`http://localhost:3100/${statistics.shortcode}`)}
                            sx={{
                              backgroundColor: 'rgba(99, 102, 241, 0.2)',
                              color: '#6366f1',
                              '&:hover': {
                                backgroundColor: 'rgba(99, 102, 241, 0.3)',
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Box 
                      sx={{
                        background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                        borderRadius: 3,
                        p: 3,
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        textAlign: 'center'
                      }}
                    >
                      <Typography 
                        variant="h2" 
                        sx={{
                          fontWeight: 800,
                          background: 'linear-gradient(145deg, #6366f1, #8b5cf6)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          mb: 1
                        }}
                      >
                        {statistics.totalClicks}
                      </Typography>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          mb: 2
                        }}
                      >
                        Total Clicks
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'rgba(255, 255, 255, 0.5)',
                          mb: 1
                        }}
                      >
                        Created: {formatDate(statistics.createdAt)}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {statistics.clicks.length > 0 && (
            <>
              <Grid item xs={12} md={4}>
                <Card 
                  elevation={6}
                  sx={{
                    background: 'linear-gradient(145deg, #1e1e2e 0%, #2a2a3e 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: 3,
                    height: 'fit-content'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" mb={3}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          background: 'linear-gradient(145deg, #059669, #0d9488)',
                          mr: 2,
                          boxShadow: '0 4px 16px rgba(5, 150, 105, 0.3)'
                        }}
                      >
                        <TimelineIcon sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: 'white',
                          fontWeight: 600
                        }}
                      >
                        Top Referrers
                      </Typography>
                    </Box>
                    <List dense>
                      {getTopReferrers(statistics.clicks).map((item, index) => (
                        <ListItem 
                          key={index} 
                          sx={{ 
                            px: 0,
                            py: 1,
                            borderRadius: 1,
                            mb: 1,
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.05)'
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: `linear-gradient(145deg, ${['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][index]}, ${['#8b5cf6', '#a855f7', '#0891b2', '#059669', '#d97706'][index]})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}
                            >
                              {index + 1}
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography sx={{ color: 'white', fontWeight: 500 }}>
                                {item.referrer}
                              </Typography>
                            }
                            secondary={
                              <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                {item.count} clicks
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card 
                  elevation={6}
                  sx={{
                    background: 'linear-gradient(145deg, #1e1e2e 0%, #2a2a3e 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: 3,
                    height: 'fit-content'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" mb={3}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          background: 'linear-gradient(145deg, #dc2626, #b91c1c)',
                          mr: 2,
                          boxShadow: '0 4px 16px rgba(220, 38, 38, 0.3)'
                        }}
                      >
                        <LanguageIcon sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: 'white',
                          fontWeight: 600
                        }}
                      >
                        Locations
                      </Typography>
                    </Box>
                    <List dense>
                      {getLocationDistribution(statistics.clicks).slice(0, 5).map((item, index) => (
                        <ListItem 
                          key={index} 
                          sx={{ 
                            px: 0,
                            py: 1,
                            borderRadius: 1,
                            mb: 1,
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.05)'
                            }
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                background: `linear-gradient(145deg, ${['#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#2563eb'][index]}, ${['#b91c1c', '#c2410c', '#a16207', '#15803d', '#1d4ed8'][index]})`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}
                            >
                              {index + 1}
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography sx={{ color: 'white', fontWeight: 500 }}>
                                {item.location}
                              </Typography>
                            }
                            secondary={
                              <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                {item.count} clicks
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card 
                  elevation={6}
                  sx={{
                    background: 'linear-gradient(145deg, #1e1e2e 0%, #2a2a3e 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: 3,
                    height: 'fit-content'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" mb={3}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          background: 'linear-gradient(145deg, #7c3aed, #6d28d9)',
                          mr: 2,
                          boxShadow: '0 4px 16px rgba(124, 58, 237, 0.3)'
                        }}
                      >
                        <AccessTimeIcon sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: 'white',
                          fontWeight: 600
                        }}
                      >
                        Recent Activity
                      </Typography>
                    </Box>
                    <List dense>
                      {statistics.clicks.slice(-5).reverse().map((click, index) => (
                        <ListItem 
                          key={index} 
                          sx={{ 
                            px: 0,
                            py: 1.5,
                            borderRadius: 1,
                            mb: 1,
                            backgroundColor: index === 0 ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                            border: index === 0 ? '1px solid rgba(124, 58, 237, 0.3)' : 'none',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.05)'
                            }
                          }}
                        >
                          <ListItemText
                            primary={
                              <Typography sx={{ color: 'white', fontWeight: 500, fontSize: '0.9rem' }}>
                                {getTimeAgo(click.timestamp)}
                              </Typography>
                            }
                            secondary={
                              <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem' }}>
                                {click.location} • {extractDomain(click.referrer)}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card 
                  elevation={6}
                  sx={{
                    background: 'linear-gradient(145deg, #1e1e2e 0%, #2a2a3e 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: 3,
                    overflow: 'hidden'
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: 'white',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2
                        }}
                      >
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            background: 'linear-gradient(145deg, #6366f1, #8b5cf6)',
                            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)'
                          }}
                        >
                          <ComputerIcon sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                        Detailed Click Analytics
                      </Typography>
                    </Box>
                    <TableContainer sx={{ maxHeight: 600 }}>
                      <Table stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell 
                              sx={{ 
                                backgroundColor: 'rgba(30, 30, 46, 0.95)',
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontWeight: 600,
                                borderBottom: '2px solid rgba(99, 102, 241, 0.3)'
                              }}
                            >
                              Timestamp
                            </TableCell>
                            <TableCell 
                              sx={{ 
                                backgroundColor: 'rgba(30, 30, 46, 0.95)',
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontWeight: 600,
                                borderBottom: '2px solid rgba(99, 102, 241, 0.3)'
                              }}
                            >
                              Referrer
                            </TableCell>
                            <TableCell 
                              sx={{ 
                                backgroundColor: 'rgba(30, 30, 46, 0.95)',
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontWeight: 600,
                                borderBottom: '2px solid rgba(99, 102, 241, 0.3)'
                              }}
                            >
                              Location
                            </TableCell>
                            <TableCell 
                              sx={{ 
                                backgroundColor: 'rgba(30, 30, 46, 0.95)',
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontWeight: 600,
                                borderBottom: '2px solid rgba(99, 102, 241, 0.3)'
                              }}
                            >
                              User Agent
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {statistics.clicks.slice().reverse().map((click, index) => (
                            <TableRow 
                              key={index} 
                              sx={{ 
                                '&:hover': {
                                  backgroundColor: 'rgba(99, 102, 241, 0.1)'
                                },
                                '&:nth-of-type(odd)': {
                                  backgroundColor: 'rgba(255, 255, 255, 0.02)'
                                },
                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                              }}
                            >
                              <TableCell sx={{ borderBottom: 'none' }}>
                                <Box>
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      color: 'white',
                                      fontWeight: 500
                                    }}
                                  >
                                    {formatDate(click.timestamp)}
                                  </Typography>
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: 'rgba(255, 255, 255, 0.6)',
                                      fontSize: '0.75rem'
                                    }}
                                  >
                                    {getTimeAgo(click.timestamp)}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                {click.referrer === 'Direct' ? (
                                  <Chip 
                                    label="Direct Access" 
                                    size="small" 
                                    sx={{
                                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                                      color: '#22c55e',
                                      border: '1px solid rgba(34, 197, 94, 0.3)',
                                      fontWeight: 500
                                    }}
                                  />
                                ) : (
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      color: 'rgba(255, 255, 255, 0.8)',
                                      backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                      px: 1.5,
                                      py: 0.5,
                                      borderRadius: 1,
                                      display: 'inline-block',
                                      fontSize: '0.875rem'
                                    }}
                                  >
                                    {extractDomain(click.referrer)}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <LanguageIcon sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.6)' }} />
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      color: 'rgba(255, 255, 255, 0.8)',
                                      fontWeight: 500
                                    }}
                                  >
                                    {click.location || 'Unknown'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ borderBottom: 'none' }}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <ComputerIcon sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.6)' }} />
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      color: 'rgba(255, 255, 255, 0.8)',
                                      maxWidth: 200,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {click.userAgent || 'Unknown'}
                                  </Typography>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </>
          )}

          {statistics.clicks.length === 0 && (
            <Grid item xs={12}>
              <Alert 
                severity="info"
                sx={{
                  backgroundColor: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: 2,
                  '& .MuiAlert-icon': {
                    color: '#06b6d4'
                  },
                  '& .MuiAlert-message': {
                    color: 'white',
                    fontSize: '1rem'
                  }
                }}
              >
                No clicks recorded for this short URL yet. Share your link to start collecting analytics data!
              </Alert>
            </Grid>
          )}
        </Grid>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            backgroundColor: snackbar.severity === 'success' ? 'rgba(34, 197, 94, 0.1)' : 
                           snackbar.severity === 'error' ? 'rgba(239, 68, 68, 0.1)' :
                           snackbar.severity === 'warning' ? 'rgba(245, 158, 11, 0.1)' :
                           'rgba(6, 182, 212, 0.1)',
            border: `1px solid ${snackbar.severity === 'success' ? 'rgba(34, 197, 94, 0.3)' : 
                                snackbar.severity === 'error' ? 'rgba(239, 68, 68, 0.3)' :
                                snackbar.severity === 'warning' ? 'rgba(245, 158, 11, 0.3)' :
                                'rgba(6, 182, 212, 0.3)'}`,
            color: 'white',
            '& .MuiAlert-icon': {
              color: snackbar.severity === 'success' ? '#22c55e' : 
                     snackbar.severity === 'error' ? '#ef4444' :
                     snackbar.severity === 'warning' ? '#f59e0b' :
                     '#06b6d4'
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Statistics;
