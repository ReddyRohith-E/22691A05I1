import React, { createContext, useContext } from 'react';

const LoggingContext = createContext();

export const useLogging = () => {
  const context = useContext(LoggingContext);
  if (!context) {
    throw new Error('useLogging must be used within a LoggingProvider');
  }
  return context;
};

export const LoggingProvider = ({ children }) => {
  // Frontend-specific logging functions that integrate with the backend logging middleware
  const logInfo = (message, meta = {}) => {
    const logData = {
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      source: 'frontend',
      ...meta
    };
    
    // In a real application, you would send this to your backend
    console.log('[INFO]', logData);
    
    // Store in sessionStorage for demonstration
    const logs = JSON.parse(sessionStorage.getItem('frontendLogs') || '[]');
    logs.push(logData);
    sessionStorage.setItem('frontendLogs', JSON.stringify(logs.slice(-100))); // Keep last 100 logs
  };

  const logError = (message, error = null, meta = {}) => {
    const logData = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      source: 'frontend',
      error: error ? {
        message: error.message,
        stack: error.stack
      } : null,
      ...meta
    };
    
    console.error('[ERROR]', logData);
    
    const logs = JSON.parse(sessionStorage.getItem('frontendLogs') || '[]');
    logs.push(logData);
    sessionStorage.setItem('frontendLogs', JSON.stringify(logs.slice(-100)));
  };

  const logWarn = (message, meta = {}) => {
    const logData = {
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      source: 'frontend',
      ...meta
    };
    
    console.warn('[WARN]', logData);
    
    const logs = JSON.parse(sessionStorage.getItem('frontendLogs') || '[]');
    logs.push(logData);
    sessionStorage.setItem('frontendLogs', JSON.stringify(logs.slice(-100)));
  };

  const logDebug = (message, meta = {}) => {
    const logData = {
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      source: 'frontend',
      ...meta
    };
    
    console.debug('[DEBUG]', logData);
    
    const logs = JSON.parse(sessionStorage.getItem('frontendLogs') || '[]');
    logs.push(logData);
    sessionStorage.setItem('frontendLogs', JSON.stringify(logs.slice(-100)));
  };

  // URL Shortener specific logging functions
  const logUrlSubmitted = (urls, meta = {}) => {
    logInfo('URLs submitted for shortening', {
      action: 'URL_SUBMITTED',
      urlCount: urls.length,
      urls: urls.map(url => ({
        url: url.url,
        customShortcode: url.shortcode,
        validity: url.validity
      })),
      ...meta
    });
  };

  const logUrlShortened = (originalUrl, shortLink, expiry, meta = {}) => {
    logInfo('URL shortened successfully', {
      action: 'URL_SHORTENED',
      originalUrl,
      shortLink,
      expiry,
      ...meta
    });
  };

  const logValidationError = (field, value, reason, meta = {}) => {
    logWarn('Client-side validation error', {
      action: 'VALIDATION_ERROR',
      field,
      value,
      reason,
      ...meta
    });
  };

  const logApiCall = (method, url, status, responseTime, meta = {}) => {
    logInfo('API call completed', {
      action: 'API_CALL',
      method,
      url,
      status,
      responseTime: `${responseTime}ms`,
      ...meta
    });
  };

  const logPageView = (page, meta = {}) => {
    logInfo('Page viewed', {
      action: 'PAGE_VIEW',
      page,
      ...meta
    });
  };

  const logUserInteraction = (interaction, element, meta = {}) => {
    logDebug('User interaction', {
      action: 'USER_INTERACTION',
      interaction,
      element,
      ...meta
    });
  };

  const value = {
    logInfo,
    logError,
    logWarn,
    logDebug,
    logUrlSubmitted,
    logUrlShortened,
    logValidationError,
    logApiCall,
    logPageView,
    logUserInteraction
  };

  return (
    <LoggingContext.Provider value={value}>
      {children}
    </LoggingContext.Provider>
  );
};
