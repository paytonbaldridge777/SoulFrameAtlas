/**
 * Validates JSON content for wiki data files.
 * Ensures the content is valid JSON and matches expected structure.
 * 
 * @param {string} content - The JSON string to validate
 * @returns {{ valid: boolean, parsed: any | null, error: string | null, isArray: boolean, itemCount: number }}
 */
export function validateJSON(content) {
  if (!content || typeof content !== 'string') {
    return {
      valid: false,
      parsed: null,
      error: 'Content must be a non-empty string',
      isArray: false,
      itemCount: 0
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    return {
      valid: false,
      parsed: null,
      error: `Invalid JSON: ${e.message}`,
      isArray: false,
      itemCount: 0
    };
  }

  // Must be an object or array
  if (typeof parsed !== 'object' || parsed === null) {
    return {
      valid: false,
      parsed: null,
      error: 'JSON content must be an object or array',
      isArray: false,
      itemCount: 0
    };
  }

  const isArray = Array.isArray(parsed);
  let itemCount = 0;

  if (isArray) {
    itemCount = parsed.length;
  } else if (parsed.items && Array.isArray(parsed.items)) {
    // Handle objects with an "items" array property
    itemCount = parsed.items.length;
  } else {
    // For plain objects, count top-level keys
    itemCount = Object.keys(parsed).length;
  }

  return {
    valid: true,
    parsed,
    error: null,
    isArray,
    itemCount
  };
}

/**
 * Safely stringify JSON with formatting
 * @param {any} data - Data to stringify
 * @param {number} indent - Indentation spaces (default: 2)
 * @returns {string} Formatted JSON string
 */
export function safeStringify(data, indent = 2) {
  try {
    return JSON.stringify(data, null, indent);
  } catch (e) {
    throw new Error(`Failed to stringify JSON: ${e.message}`);
  }
}

/**
 * Get item count from parsed JSON
 * @param {any} parsed - Parsed JSON data
 * @returns {number} Number of items
 */
export function getItemCount(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return 0;
  }

  if (Array.isArray(parsed)) {
    return parsed.length;
  }

  if (parsed.items && Array.isArray(parsed.items)) {
    return parsed.items.length;
  }

  // For objects, count top-level keys
  return Object.keys(parsed).length;
}
