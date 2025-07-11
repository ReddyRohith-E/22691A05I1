const validator = require('validator');
const { nanoid } = require('nanoid');
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');

const {
  logUrlCreated,
  logUrlAccessed,
  logUrlNotFound,
  logUrlExpired,
  logShortCodeCollision,
  logValidationError,
  logError,
  logInfo
} = require('../../LoggingMiddleware');

const urlService = require('../services/urlService');
const validationService = require('../services/validationService');


const createShortUrl = async (req, res) => {
  try {
    const { url, validity, shortcode } = req.body;
    
    logInfo('URL shortening request received', {
      originalUrl: url,
      customShortcode: shortcode,
      validity: validity
    });

    if (!url) {
      logValidationError('url', url, 'URL is required');
      return res.status(400).json({
        error: 'Validation Error',
        message: 'URL is required'
      });
    }

    const urlValidation = validationService.validateUrl(url);
    if (!urlValidation.isValid) {
      logValidationError('url', url, urlValidation.error);
      return res.status(400).json({
        error: 'Validation Error',
        message: urlValidation.error
      });
    }

    const validityValidation = validationService.validateValidity(validity);
    if (!validityValidation.isValid) {
      logValidationError('validity', validity, validityValidation.error);
      return res.status(400).json({
        error: 'Validation Error',
        message: validityValidation.error
      });
    }
    const validityMinutes = validityValidation.value;

    if (shortcode) {
      const shortcodeValidation = validationService.validateShortcode(shortcode);
      if (!shortcodeValidation.isValid) {
        logValidationError('shortcode', shortcode, shortcodeValidation.error);
        return res.status(400).json({
          error: 'Validation Error',
          message: shortcodeValidation.error
        });
      }

      if (urlService.shortcodeExists(shortcode)) {
        logShortCodeCollision(shortcode);
        return res.status(409).json({
          error: 'Conflict',
          message: 'Shortcode already exists. Please choose a different one.'
        });
      }
    }

    const finalShortcode = shortcode || urlService.generateShortcode();

    const expiresAt = new Date(Date.now() + (validityMinutes * 60 * 1000));


    const urlEntry = {
      shortcode: finalShortcode,
      originalUrl: url,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      clicks: []
    };


    urlService.storeUrl(urlEntry);


    const shortLink = `http://localhost:${process.env.PORT || 3100}/${finalShortcode}`;

    logUrlCreated(url, finalShortcode, expiresAt.toISOString());

    res.status(201).json({
      shortLink,
      expiry: expiresAt.toISOString()
    });

  } catch (error) {
    logError('Error creating short URL', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create short URL'
    });
  }
};


const redirectToUrl = async (req, res) => {
  try {
    const { shortcode } = req.params;
    
    logInfo('Redirect request received', { shortcode });

 
    const urlEntry = urlService.getUrl(shortcode);

    if (!urlEntry) {
      logUrlNotFound(shortcode);
      return res.status(404).json({
        error: 'Not Found',
        message: 'Short URL not found'
      });
    }

    if (new Date() > new Date(urlEntry.expiresAt)) {
      logUrlExpired(shortcode);
      return res.status(410).json({
        error: 'Gone',
        message: 'Short URL has expired'
      });
    }

    const userAgent = req.get('User-Agent') || 'Unknown';
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';
    const referrer = req.get('Referer') || 'Direct';
    
  
    const geo = geoip.lookup(ip);
    const location = geo ? `${geo.city || 'Unknown'}, ${geo.country || 'Unknown'}` : 'Unknown';

  
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    const browser = `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim();


    const clickData = {
      timestamp: new Date().toISOString(),
      referrer,
      location,
      userAgent: browser,
      ip: ip.replace(/^.*:/, '')
    };

    urlService.recordClick(shortcode, clickData);

    logUrlAccessed(shortcode, urlEntry.originalUrl, browser, ip, referrer);

    
    res.redirect(302, urlEntry.originalUrl);

  } catch (error) {
    logError('Error redirecting URL', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to redirect'
    });
  }
};


const getUrlStats = async (req, res) => {
  try {
    const { shortcode } = req.params;
    
    logInfo('Statistics request received', { shortcode });

 
    const urlEntry = urlService.getUrl(shortcode);

    if (!urlEntry) {
      logUrlNotFound(shortcode);
      return res.status(404).json({
        error: 'Not Found',
        message: 'Short URL not found'
      });
    }

 
    const stats = {
      shortcode: urlEntry.shortcode,
      originalUrl: urlEntry.originalUrl,
      createdAt: urlEntry.createdAt,
      expiresAt: urlEntry.expiresAt,
      totalClicks: urlEntry.clicks.length,
      clicks: urlEntry.clicks.map(click => ({
        timestamp: click.timestamp,
        referrer: click.referrer,
        location: click.location,
        userAgent: click.userAgent
      }))
    };

    logInfo('Statistics retrieved successfully', { 
      shortcode, 
      totalClicks: stats.totalClicks 
    });

    res.status(200).json(stats);

  } catch (error) {
    logError('Error retrieving URL statistics', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve statistics'
    });
  }
};

module.exports = {
  createShortUrl,
  redirectToUrl,
  getUrlStats
};
