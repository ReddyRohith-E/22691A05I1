const { nanoid } = require('nanoid');

const urlStorage = new Map();

const generateShortcode = () => {
  let shortcode;
  do {
    shortcode = nanoid(6);
  } while (urlStorage.has(shortcode));
  
  return shortcode;
};

const shortcodeExists = (shortcode) => {
  return urlStorage.has(shortcode);
};

const storeUrl = (urlEntry) => {
  urlStorage.set(urlEntry.shortcode, urlEntry);
};

const getUrl = (shortcode) => {
  return urlStorage.get(shortcode);
};

const recordClick = (shortcode, clickData) => {
  const urlEntry = urlStorage.get(shortcode);
  if (urlEntry) {
    urlEntry.clicks.push(clickData);
    urlStorage.set(shortcode, urlEntry);
  }
};

const getAllUrls = () => {
  return Array.from(urlStorage.values());
};

const cleanupExpiredUrls = () => {
  const now = new Date();
  const expiredShortcodes = [];
  
  for (const [shortcode, urlEntry] of urlStorage.entries()) {
    if (new Date(urlEntry.expiresAt) < now) {
      expiredShortcodes.push(shortcode);
    }
  }
  
  expiredShortcodes.forEach(shortcode => {
    urlStorage.delete(shortcode);
  });
  
  return expiredShortcodes.length;
};

module.exports = {
  generateShortcode,
  shortcodeExists,
  storeUrl,
  getUrl,
  recordClick,
  getAllUrls,
  cleanupExpiredUrls
};
