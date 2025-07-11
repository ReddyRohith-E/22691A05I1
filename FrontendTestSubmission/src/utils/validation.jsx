export const validateUrl = (url) => {
  if (!url || url.trim() === '') {
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

  const urlPattern = /^https?:\/\/.+/i;
  if (!urlPattern.test(trimmedUrl)) {
    return {
      isValid: false,
      error: 'URL must start with http:// or https://'
    };
  }

  try {
    const urlObj = new URL(trimmedUrl);
    
    // Additional validation for hostname format - more permissive for subdomains
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

export const validateShortcode = (shortcode) => {
  if (!shortcode || shortcode.trim() === '') {
    return {
      isValid: true,
      error: null
    };
  }

  const trimmedShortcode = shortcode.trim();

  if (trimmedShortcode.length < 4 || trimmedShortcode.length > 10) {
    return {
      isValid: false,
      error: 'Shortcode must be between 4 and 10 characters'
    };
  }

  const alphanumericPattern = /^[a-zA-Z0-9]+$/;
  if (!alphanumericPattern.test(trimmedShortcode)) {
    return {
      isValid: false,
      error: 'Shortcode can only contain letters and numbers'
    };
  }

  const reservedWords = ['api', 'admin', 'www', 'shorturls', 'health', 'stats'];
  if (reservedWords.includes(trimmedShortcode.toLowerCase())) {
    return {
      isValid: false,
      error: 'This shortcode is reserved. Please choose another.'
    };
  }

  return {
    isValid: true,
    error: null
  };
};

export const validateValidity = (validity) => {
  if (!validity || validity.trim() === '') {
    return {
      isValid: true,
      error: null,
      value: 30
    };
  }

  const numericValue = parseInt(validity.trim(), 10);

  if (isNaN(numericValue)) {
    return {
      isValid: false,
      error: 'Validity must be a number'
    };
  }

  if (numericValue < 1 || numericValue > 43200) {
    return {
      isValid: false,
      error: 'Validity must be between 1 and 43200 minutes (30 days)'
    };
  }

  return {
    isValid: true,
    error: null,
    value: numericValue
  };
};

/**
 * Validate a complete URL form entry
 */
export const validateUrlEntry = (entry) => {
  const errors = {};
  
  const urlValidation = validateUrl(entry.url);
  if (!urlValidation.isValid) {
    errors.url = urlValidation.error;
  }

  const shortcodeValidation = validateShortcode(entry.shortcode);
  if (!shortcodeValidation.isValid) {
    errors.shortcode = shortcodeValidation.error;
  }

  const validityValidation = validateValidity(entry.validity);
  if (!validityValidation.isValid) {
    errors.validity = validityValidation.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    validatedData: {
      url: entry.url?.trim(),
      shortcode: entry.shortcode?.trim() || undefined,
      validity: validityValidation.value
    }
  };
};

export const validateMultipleEntries = (entries) => {
  const results = [];
  const shortcodes = new Set();
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const validation = validateUrlEntry(entry);
    
    if (validation.validatedData.shortcode) {
      if (shortcodes.has(validation.validatedData.shortcode.toLowerCase())) {
        validation.isValid = false;
        validation.errors.shortcode = 'Duplicate shortcode in this batch';
      } else {
        shortcodes.add(validation.validatedData.shortcode.toLowerCase());
      }
    }
    
    results.push({
      index: i,
      ...validation
    });
  }
  
  return results;
};
