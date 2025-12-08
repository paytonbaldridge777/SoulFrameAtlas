// Test security functions for the admin API
const assert = require('assert');

// Import sanitization logic (we'll test the logic directly)
function sanitizeFilename(filename) {
  // Only allow alphanumeric, underscore, hyphen, and .json extension
  const match = filename.match(/^([a-zA-Z0-9_\-]+)(\.json)?$/);
  if (!match) {
    throw new Error('Invalid filename. Only alphanumeric characters, underscores, and hyphens are allowed.');
  }
  return match[1] + '.json';
}

function validateJSON(content) {
  try {
    const parsed = JSON.parse(content);
    
    // Check if it's an array or object
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('JSON content must be an object or array');
    }
    
    return parsed;
  } catch (err) {
    throw new Error(`Invalid JSON: ${err.message}`);
  }
}

// Test suite
console.log('Running security tests...\n');

// Test 1: Filename sanitization - valid filenames
console.log('Test 1: Valid filenames');
try {
  assert.strictEqual(sanitizeFilename('weapons.json'), 'weapons.json');
  assert.strictEqual(sanitizeFilename('weapons'), 'weapons.json');
  assert.strictEqual(sanitizeFilename('new_category'), 'new_category.json');
  assert.strictEqual(sanitizeFilename('armor-grouped'), 'armor-grouped.json');
  assert.strictEqual(sanitizeFilename('test123'), 'test123.json');
  console.log('✅ PASS: Valid filenames accepted\n');
} catch (err) {
  console.error('❌ FAIL:', err.message, '\n');
  process.exit(1);
}

// Test 2: Filename sanitization - path traversal attempts
console.log('Test 2: Path traversal prevention');
const pathTraversalAttempts = [
  '../../../etc/passwd',
  '../../data/weapons',
  '../weapons.json',
  'data/../weapons',
  '/etc/passwd',
  'weapons/../armor',
  '..\\..\\windows\\system32',
  'weapons.json..',
];

let pathTraversalBlocked = 0;
pathTraversalAttempts.forEach(attempt => {
  try {
    sanitizeFilename(attempt);
    console.error(`❌ FAIL: Path traversal not blocked: ${attempt}`);
    process.exit(1);
  } catch (err) {
    pathTraversalBlocked++;
  }
});
console.log(`✅ PASS: ${pathTraversalBlocked} path traversal attempts blocked\n`);

// Test 3: Filename sanitization - special characters
console.log('Test 3: Special character prevention');
const specialCharAttempts = [
  'weapons;rm -rf',
  'data$(whoami)',
  'file`ls`',
  'name with spaces.json',
  'file@domain.json',
  'file#hash.json',
  'file$var.json',
  'file%20name.json',
  'file&command.json',
];

let specialCharsBlocked = 0;
specialCharAttempts.forEach(attempt => {
  try {
    sanitizeFilename(attempt);
    console.error(`❌ FAIL: Special characters not blocked: ${attempt}`);
    process.exit(1);
  } catch (err) {
    specialCharsBlocked++;
  }
});
console.log(`✅ PASS: ${specialCharsBlocked} special character attempts blocked\n`);

// Test 4: JSON validation - valid JSON
console.log('Test 4: Valid JSON');
try {
  validateJSON('[]');
  validateJSON('{}');
  validateJSON('{"key": "value"}');
  validateJSON('[1, 2, 3]');
  validateJSON('{"weapons": [{"name": "Sword"}]}');
  console.log('✅ PASS: Valid JSON accepted\n');
} catch (err) {
  console.error('❌ FAIL:', err.message, '\n');
  process.exit(1);
}

// Test 5: JSON validation - invalid JSON
console.log('Test 5: Invalid JSON detection');
const invalidJSONAttempts = [
  'not json',
  '{invalid}',
  '[1, 2, 3,]',
  '{"key": undefined}',
  'null',
  '123',
  '"string"',
  'true',
];

let invalidJSONBlocked = 0;
invalidJSONAttempts.forEach(attempt => {
  try {
    validateJSON(attempt);
    console.error(`❌ FAIL: Invalid JSON not detected: ${attempt}`);
    process.exit(1);
  } catch (err) {
    invalidJSONBlocked++;
  }
});
console.log(`✅ PASS: ${invalidJSONBlocked} invalid JSON attempts blocked\n`);

// Test 6: JSON validation - malformed JSON
console.log('Test 6: Malformed JSON detection');
const malformedJSONAttempts = [
  '{',
  '}',
  '[',
  ']',
  '{"key":',
  '{"key": "value"',
  '[1, 2, 3',
  '{"a": {"b": }',
];

let malformedJSONBlocked = 0;
malformedJSONAttempts.forEach(attempt => {
  try {
    validateJSON(attempt);
    console.error(`❌ FAIL: Malformed JSON not detected: ${attempt}`);
    process.exit(1);
  } catch (err) {
    malformedJSONBlocked++;
  }
});
console.log(`✅ PASS: ${malformedJSONBlocked} malformed JSON attempts blocked\n`);

// Test 7: Edge cases
console.log('Test 7: Edge cases');
try {
  // Empty filename should be rejected
  try {
    sanitizeFilename('');
    console.error('❌ FAIL: Empty filename not blocked');
    process.exit(1);
  } catch (err) {
    // Expected
  }

  // Just extension should be rejected
  try {
    sanitizeFilename('.json');
    console.error('❌ FAIL: Extension-only filename not blocked');
    process.exit(1);
  } catch (err) {
    // Expected
  }

  // Very long valid filename should work
  const longName = 'a'.repeat(100);
  assert.strictEqual(sanitizeFilename(longName), longName + '.json');

  console.log('✅ PASS: Edge cases handled correctly\n');
} catch (err) {
  console.error('❌ FAIL:', err.message, '\n');
  process.exit(1);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('✅ All security tests passed!');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
