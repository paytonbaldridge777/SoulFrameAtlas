/**
 * Validates and sanitizes filenames for wiki data files.
 * Only allows alphanumeric characters, underscores, hyphens, and .json extension.
 * 
 * @param {string} filename - The filename to validate
 * @returns {{ valid: boolean, sanitized: string | null, error: string | null }}
 */
export function validateFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return {
      valid: false,
      sanitized: null,
      error: 'Filename must be a non-empty string'
    };
  }

  // Trim whitespace
  const trimmed = filename.trim();

  // Check if filename matches the allowed pattern
  const pattern = /^[a-zA-Z0-9_\-]+\.json$/;
  
  if (!pattern.test(trimmed)) {
    return {
      valid: false,
      sanitized: null,
      error: 'Filename must contain only letters, numbers, underscores, hyphens, and end with .json'
    };
  }

  // Check for double extensions or suspicious patterns
  if (trimmed.includes('..') || trimmed.startsWith('.') || trimmed.endsWith('..json')) {
    return {
      valid: false,
      sanitized: null,
      error: 'Invalid filename pattern detected'
    };
  }

  // Check length constraints
  if (trimmed.length < 6) { // Minimum: "a.json"
    return {
      valid: false,
      sanitized: null,
      error: 'Filename too short (minimum 1 character + .json)'
    };
  }

  if (trimmed.length > 100) {
    return {
      valid: false,
      sanitized: null,
      error: 'Filename too long (maximum 100 characters)'
    };
  }

  return {
    valid: true,
    sanitized: trimmed,
    error: null
  };
}

/**
 * Extracts the base name without extension
 * @param {string} filename - The filename
 * @returns {string} Base name without .json extension
 */
export function getBaseName(filename) {
  if (!filename || !filename.endsWith('.json')) {
    return filename;
  }
  return filename.slice(0, -5);
}
