export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

export const validateShortCode = (code) => {
  return /^[a-zA-Z0-9_-]+$/.test(code);
};