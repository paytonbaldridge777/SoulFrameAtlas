/**
 * Simple unit tests for jsonValidation helper
 * Run with: node jsonValidation.test.js
 */

import { validateJSON, safeStringify, getItemCount } from '../jsonValidation.js';

function runTests() {
  const tests = [
    // Valid JSON
    { 
      input: '{"name": "test"}', 
      expected: true, 
      desc: 'Valid JSON object',
      expectedArray: false,
      expectedCount: 1
    },
    { 
      input: '[{"id": 1}, {"id": 2}]', 
      expected: true, 
      desc: 'Valid JSON array',
      expectedArray: true,
      expectedCount: 2
    },
    { 
      input: '{"items": [{"id": 1}, {"id": 2}, {"id": 3}]}', 
      expected: true, 
      desc: 'Valid JSON with items array',
      expectedArray: false,
      expectedCount: 3
    },
    
    // Invalid JSON
    { input: '', expected: false, desc: 'Empty string' },
    { input: null, expected: false, desc: 'Null value' },
    { input: undefined, expected: false, desc: 'Undefined value' },
    { input: 'not json', expected: false, desc: 'Invalid JSON syntax' },
    { input: '{invalid}', expected: false, desc: 'Malformed JSON' },
    { input: '"just a string"', expected: false, desc: 'JSON string primitive' },
    { input: '123', expected: false, desc: 'JSON number primitive' },
    { input: 'true', expected: false, desc: 'JSON boolean primitive' },
  ];

  let passed = 0;
  let failed = 0;

  console.log('Running validateJSON tests...\n');

  for (const test of tests) {
    const result = validateJSON(test.input);
    const success = result.valid === test.expected;
    
    if (success) {
      if (test.expected && test.expectedArray !== undefined) {
        if (result.isArray === test.expectedArray && result.itemCount === test.expectedCount) {
          passed++;
          console.log(`✓ ${test.desc} (isArray: ${result.isArray}, count: ${result.itemCount})`);
        } else {
          failed++;
          console.log(`✗ ${test.desc} - wrong metadata`);
          console.log(`  Expected isArray: ${test.expectedArray}, count: ${test.expectedCount}`);
          console.log(`  Got isArray: ${result.isArray}, count: ${result.itemCount}`);
        }
      } else {
        passed++;
        console.log(`✓ ${test.desc}`);
      }
    } else {
      failed++;
      console.log(`✗ ${test.desc}`);
      console.log(`  Expected valid: ${test.expected}, Got: ${result.valid}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    }
  }

  // Test safeStringify
  console.log('\nTesting safeStringify...');
  try {
    const obj = { name: 'test', value: 123 };
    const result = safeStringify(obj);
    const expected = JSON.stringify(obj, null, 2);
    if (result === expected) {
      passed++;
      console.log('✓ safeStringify works correctly');
    } else {
      failed++;
      console.log('✗ safeStringify output mismatch');
    }
  } catch (e) {
    failed++;
    console.log(`✗ safeStringify threw error: ${e.message}`);
  }

  // Test getItemCount
  console.log('\nTesting getItemCount...');
  const countTests = [
    { input: [1, 2, 3], expected: 3, desc: 'Array with 3 items' },
    { input: { items: [1, 2] }, expected: 2, desc: 'Object with items array' },
    { input: { a: 1, b: 2, c: 3 }, expected: 3, desc: 'Object with 3 keys' },
    { input: null, expected: 0, desc: 'Null input' },
    { input: {}, expected: 0, desc: 'Empty object' },
  ];

  for (const test of countTests) {
    const result = getItemCount(test.input);
    if (result === test.expected) {
      passed++;
      console.log(`✓ ${test.desc}: ${result}`);
    } else {
      failed++;
      console.log(`✗ ${test.desc}: expected ${test.expected}, got ${result}`);
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Run tests
const success = runTests();
process.exit(success ? 0 : 1);
