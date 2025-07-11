
const validateShortcode = (shortcode) => {
  
  if (!shortcode) {
    return {
      isValid: false,
      error: 'Shortcode cannot be empty'
    };
  }

  if (shortcode.length < 4 || shortcode.length > 10) {
    return {
      isValid: false,
      error: 'Shortcode must be between 4 and 10 characters long'
    };
  }

  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  if (!alphanumericRegex.test(shortcode)) {
    return {
      isValid: false,
      error: 'Shortcode can only contain alphanumeric characters (a-z, A-Z, 0-9)'
    };
  }

  const reservedWords = ['api', 'admin', 'www', 'shorturls', 'health', 'stats'];
  if (reservedWords.includes(shortcode.toLowerCase())) {
    return {
      isValid: false,
      error: 'Shortcode uses a reserved word. Please choose a different shortcode.'
    };
  }

  return {
    isValid: true,
    error: null
  };
};


const validateUrl = (url) => {
  if (!url) {
    return {
      isValid: false,
      error: 'URL is required'
    };
  }

  const trimmedUrl = url.trim();

  if (trimmedUrl.includes(' ')) {
    return {
      isValid: false,
      error: 'URL cannot contain spaces'
    };
  }

  try {
    const urlObj = new URL(trimmedUrl);

    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        isValid: false,
        error: 'URL must use http:// or https:// protocol'
      };
    }

    if (!urlObj.hostname) {
      return {
        isValid: false,
        error: 'URL must have a valid hostname'
      };
    }
    const hostnameRegex = /^[a-zA-Z0-9.-]+$/;
    if (!hostnameRegex.test(urlObj.hostname) || !urlObj.hostname.includes('.')) {
      return {
        isValid: false,
        error: 'URL must have a valid domain name'
      };
    }
    if (urlObj.hostname.startsWith('-') || urlObj.hostname.endsWith('-') || 
        urlObj.hostname.startsWith('.') || urlObj.hostname.endsWith('.')) {
      return {
        isValid: false,
        error: 'URL domain name format is invalid'
      };
    }

    return {
      isValid: true,
      error: null,
      normalizedUrl: trimmedUrl
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }
};


const validateValidity = (validity) => {
  if (validity === undefined || validity === null) {
    return {
      isValid: true,
      error: null,
      value: 30
    };
  }

  if (!Number.isInteger(validity)) {
    return {
      isValid: false,
      error: 'Validity must be an integer'
    };
  }


  if (validity < 1 || validity > 43200) {
    return {
      isValid: false,
      error: 'Validity must be between 1 and 43200 minutes (30 days)'
    };
  }

  return {
    isValid: true,
    error: null,
    value: validity
  };
};

module.exports = {
  validateShortcode,
  validateUrl,
  validateValidity
};
