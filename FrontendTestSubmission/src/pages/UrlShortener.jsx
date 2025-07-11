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
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  ContentCopy as CopyIcon,
  Link as LinkIcon,
  Clear as ClearIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useLogging } from '../context/LoggingContext';
import { createMultipleShortUrls } from '../services/apiService';
import { validateMultipleEntries } from '../utils/validation';
import { formatDate, copyToClipboard, getExpiryStatus, generateShortcodeSuggestion } from '../utils/helpers';

const UrlShortener = () => {
  const { logPageView, logUrlSubmitted, logUrlShortened, logValidationError, logApiCall, logUserInteraction } = useLogging();
  
  const [urlEntries, setUrlEntries] = useState([
    { url: '', validity: '', shortcode: '' }
  ]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    logPageView('url-shortener');
  }, [logPageView]);

  const addUrlEntry = () => {
    if (urlEntries.length < 5) {
      setUrlEntries([...urlEntries, { url: '', validity: '', shortcode: '' }]);
      logUserInteraction('click', 'add-url-entry');
    }
  };

  const removeUrlEntry = (index) => {
    if (urlEntries.length > 1) {
      const newEntries = urlEntries.filter((_, i) => i !== index);
      setUrlEntries(newEntries);
      
      const newErrors = { ...errors };
      delete newErrors[index];
      setErrors(newErrors);
      
      logUserInteraction('click', 'remove-url-entry', { index });
    }
  };

  const updateUrlEntry = (index, field, value) => {
    const newEntries = [...urlEntries];
    newEntries[index][field] = value;
    setUrlEntries(newEntries);

    if (errors[index]?.[field]) {
      const newErrors = { ...errors };
      delete newErrors[index][field];
      setErrors(newErrors);
    }
  };

  const handleUrlBlur = (index, value) => {
    const trimmedValue = value.trim();
    if (trimmedValue !== value) {
      updateUrlEntry(index, 'url', trimmedValue);
    }
  };

  const generateSuggestion = (index) => {
    const suggestion = generateShortcodeSuggestion();
    updateUrlEntry(index, 'shortcode', suggestion);
    logUserInteraction('click', 'generate-shortcode-suggestion', { index, suggestion });
  };

  const clearForm = () => {
    setUrlEntries([{ url: '', validity: '', shortcode: '' }]);
    setResults([]);
    setErrors({});
    logUserInteraction('click', 'clear-form');
  };

  const handleSubmit = async () => {
    logUserInteraction('click', 'submit-urls');
    
    const nonEmptyEntries = urlEntries.filter(entry => entry.url.trim() !== '');
    
    if (nonEmptyEntries.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please enter at least one URL',
        severity: 'warning'
      });
      return;
    }

    const validationResults = validateMultipleEntries(nonEmptyEntries);
    const hasErrors = validationResults.some(result => !result.isValid);

    if (hasErrors) {
      const errorMap = {};
      validationResults.forEach(result => {
        if (!result.isValid) {
          errorMap[result.index] = result.errors;
          Object.keys(result.errors).forEach(field => {
            logValidationError(field, result.validatedData[field], result.errors[field], {
              entryIndex: result.index
            });
          });
        }
      });
      setErrors(errorMap);
      setSnackbar({
        open: true,
        message: 'Please fix the validation errors',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const validEntries = validationResults.map(result => result.validatedData);
      
      logUrlSubmitted(validEntries);

      const startTime = Date.now();
      const apiResults = await createMultipleShortUrls(validEntries);
      const totalTime = Date.now() - startTime;

      logApiCall('POST', '/shorturls (batch)', 'mixed', totalTime, {
        batchSize: validEntries.length,
        results: apiResults.map(r => ({ success: r.success, status: r.error?.status }))
      });

      const successfulResults = [];
      const failedResults = [];

      apiResults.forEach((result, index) => {
        if (result.success) {
          successfulResults.push({
            ...result.data,
            originalUrl: result.originalData.url,
            index
          });
          
          logUrlShortened(
            result.originalData.url,
            result.data.shortLink,
            result.data.expiry
          );
        } else {
          failedResults.push({
            error: result.error.message,
            originalUrl: result.originalData.url,
            index
          });
        }
      });

      setResults(apiResults);

      if (successfulResults.length > 0) {
        setSnackbar({
          open: true,
          message: `Successfully shortened ${successfulResults.length} URL(s)`,
          severity: 'success'
        });
      }

      if (failedResults.length > 0) {
        setSnackbar({
          open: true,
          message: `${failedResults.length} URL(s) failed to shorten`,
          severity: 'error'
        });
      }

    } catch (error) {
      console.error('Batch URL shortening failed:', error);
      setSnackbar({
        open: true,
        message: 'Failed to shorten URLs. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (shortLink) => {
    const success = await copyToClipboard(shortLink);
    setSnackbar({
      open: true,
      message: success ? 'Link copied to clipboard!' : 'Failed to copy link',
      severity: success ? 'success' : 'error'
    });
    
    logUserInteraction('click', 'copy-short-link', { shortLink, success });
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
            <LinkIcon sx={{ fontSize: 32, color: 'white' }} />
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
            URL Shortener Pro
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
          Transform long URLs into short, memorable links. Create up to 5 URLs simultaneously with custom shortcodes and expiry settings.
        </Typography>

        <Grid container spacing={3}>
          {urlEntries.map((entry, index) => (
            <Grid item xs={12} key={index}>
              <Card 
                variant="outlined" 
                sx={{ 
                  p: 3,
                  background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.08))',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: 2,
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    border: '1px solid rgba(99, 102, 241, 0.4)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 32px rgba(99, 102, 241, 0.2)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <Box display="flex" alignItems="center" mb={3}>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: `linear-gradient(145deg, ${['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][index % 5]}, ${['#8b5cf6', '#a855f7', '#0891b2', '#059669', '#d97706'][index % 5]})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.875rem',
                      fontWeight: 'bold',
                      mr: 2,
                      boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      flexGrow: 1,
                      color: 'white',
                      fontWeight: 600
                    }}
                  >
                    URL Link {index + 1}
                  </Typography>
                  {urlEntries.length > 1 && (
                    <IconButton
                      onClick={() => removeUrlEntry(index)}
                      sx={{
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        '&:hover': {
                          backgroundColor: 'rgba(239, 68, 68, 0.3)',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                      size="small"
                    >
                      <ClearIcon />
                    </IconButton>
                  )}
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Long URL"
                      placeholder="https://example.com/your-long-url"
                      value={entry.url}
                      onChange={(e) => updateUrlEntry(index, 'url', e.target.value)}
                      onBlur={(e) => handleUrlBlur(index, e.target.value)}
                      error={!!errors[index]?.url}
                      helperText={errors[index]?.url || 'Enter the URL you want to shorten'}
                      required
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
                          fontSize: '1rem'
                        },
                        '& .MuiFormHelperText-root': {
                          color: errors[index]?.url ? '#ef4444' : 'rgba(255, 255, 255, 0.5)'
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Validity (minutes)"
                      placeholder="30"
                      type="number"
                      value={entry.validity}
                      onChange={(e) => updateUrlEntry(index, 'validity', e.target.value)}
                      error={!!errors[index]?.validity}
                      helperText={errors[index]?.validity || 'Default: 30 minutes'}
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
                          fontSize: '1rem'
                        },
                        '& .MuiFormHelperText-root': {
                          color: errors[index]?.validity ? '#ef4444' : 'rgba(255, 255, 255, 0.5)'
                        }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Box display="flex" gap={1}>
                      <TextField
                        fullWidth
                        label="Custom Shortcode"
                        placeholder="mylink"
                        value={entry.shortcode}
                        onChange={(e) => updateUrlEntry(index, 'shortcode', e.target.value)}
                        error={!!errors[index]?.shortcode}
                        helperText={errors[index]?.shortcode || 'Optional: 4-10 chars'}
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
                            fontSize: '1rem'
                          },
                          '& .MuiFormHelperText-root': {
                            color: errors[index]?.shortcode ? '#ef4444' : 'rgba(255, 255, 255, 0.5)'
                          }
                        }}
                      />
                      <Tooltip title="Generate suggestion" arrow>
                        <IconButton
                          onClick={() => generateSuggestion(index)}
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
                          <RefreshIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box display="flex" gap={3} mt={4} flexWrap="wrap">
          <Button
            startIcon={<AddIcon />}
            onClick={addUrlEntry}
            disabled={urlEntries.length >= 5}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '2px solid rgba(99, 102, 241, 0.3)',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                background: 'rgba(99, 102, 241, 0.1)',
                border: '2px solid rgba(99, 102, 241, 0.5)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.2)'
              },
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.02)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.3)'
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            Add URL ({urlEntries.length}/5)
          </Button>
          
          <Button
            startIcon={<ClearIcon />}
            onClick={clearForm}
            disabled={loading}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              color: 'white',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                background: 'rgba(239, 68, 68, 0.1)',
                border: '2px solid rgba(239, 68, 68, 0.5)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.2)'
              },
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.02)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.3)'
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            Clear All
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LinkIcon />}
            sx={{ 
              ml: 'auto',
              borderRadius: 2,
              px: 4,
              py: 1.5,
              background: loading ? 'rgba(99, 102, 241, 0.3)' : 'linear-gradient(145deg, #6366f1, #8b5cf6)',
              boxShadow: loading ? 'none' : '0 8px 32px rgba(99, 102, 241, 0.4)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                background: loading ? 'rgba(99, 102, 241, 0.3)' : 'linear-gradient(145deg, #5855eb, #7c3aed)',
                boxShadow: '0 12px 40px rgba(99, 102, 241, 0.5)',
                transform: 'translateY(-2px)'
              },
              '&:disabled': {
                background: 'rgba(99, 102, 241, 0.3)',
                color: 'rgba(255, 255, 255, 0.7)'
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {loading ? 'Processing...' : 'Create Short Links'}
          </Button>
        </Box>
      </Paper>

      {results.length > 0 && (
        <Paper 
          elevation={8} 
          sx={{ 
            p: 4,
            background: 'linear-gradient(145deg, #1e1e2e 0%, #2a2a3e 100%)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 3,
            backdropFilter: 'blur(10px)'
          }}
        >
          <Box display="flex" alignItems="center" mb={3}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                background: 'linear-gradient(145deg, #10b981, #059669)',
                mr: 2,
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
              }}
            >
              <LinkIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Typography 
              variant="h5" 
              sx={{ 
                color: 'white',
                fontWeight: 600
              }}
            >
              Generated Links
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {results.map((result, index) => (
              <Grid item xs={12} key={index}>
                <Card 
                  variant="outlined"
                  sx={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    borderRadius: 2,
                    backdropFilter: 'blur(10px)',
                    '&:hover': {
                      border: '1px solid rgba(99, 102, 241, 0.4)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 16px rgba(99, 102, 241, 0.2)'
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {result.success ? (
                      <Box>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: 'linear-gradient(145deg, #10b981, #059669)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}
                          >
                            ✓
                          </Box>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              color: '#10b981',
                              fontWeight: 600
                            }}
                          >
                            Success
                          </Typography>
                          <Chip 
                            {...getExpiryStatus(result.data.expiry)} 
                            size="small" 
                            label={getExpiryStatus(result.data.expiry).status}
                            sx={{
                              fontWeight: 500,
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
                        
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.6)', 
                            mb: 2,
                            wordBreak: 'break-all'
                          }}
                        >
                          Original: {result.originalData.url}
                        </Typography>
                        
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <TextField
                            fullWidth
                            variant="outlined"
                            value={result.data.shortLink}
                            InputProps={{
                              readOnly: true,
                              sx: { 
                                fontFamily: 'Monaco, Consolas, monospace',
                                fontSize: '1rem',
                                color: '#6366f1',
                                fontWeight: 600,
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                borderRadius: 2,
                                '& fieldset': {
                                  borderColor: 'rgba(99, 102, 241, 0.3)',
                                  borderWidth: 2
                                }
                              }
                            }}
                            size="small"
                          />
                          <Tooltip title="Copy link" arrow>
                            <IconButton
                              onClick={() => handleCopyLink(result.data.shortLink)}
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
                              <CopyIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontSize: '0.875rem'
                          }}
                        >
                          Expires: {formatDate(result.data.expiry)}
                        </Typography>
                      </Box>
                    ) : (
                      <Box>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: 'linear-gradient(145deg, #ef4444, #dc2626)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}
                          >
                            ✗
                          </Box>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              color: '#ef4444',
                              fontWeight: 600
                            }}
                          >
                            Failed
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'rgba(255, 255, 255, 0.6)', 
                            mb: 2,
                            wordBreak: 'break-all'
                          }}
                        >
                          Original: {result.originalData.url}
                        </Typography>
                        <Alert 
                          severity="error"
                          sx={{
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: 2,
                            '& .MuiAlert-icon': {
                              color: '#ef4444'
                            },
                            '& .MuiAlert-message': {
                              color: 'white'
                            }
                          }}
                        >
                          {result.error.message || 'Unknown error occurred'}
                        </Alert>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
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

export default UrlShortener;
