/**
 * Simple unit tests for validateFilename helper
 * Run with: node validateFilename.test.js
 */

import { validateFilename, getBaseName } from '../validateFilename.js';

function runTests() {
  const tests = [
    // Valid filenames
    { input: 'items.json', expected: true, desc: 'Valid simple filename' },
    { input: 'my-data.json', expected: true, desc: 'Valid filename with hyphen' },
    { input: 'my_data_123.json', expected: true, desc: 'Valid filename with underscore and numbers' },
    { input: 'TEST.json', expected: true, desc: 'Valid uppercase filename' },
    { input: 'data-file_v2.json', expected: true, desc: 'Valid complex filename' },
    
    // Invalid filenames
    { input: '', expected: false, desc: 'Empty string' },
    { input: null, expected: false, desc: 'Null value' },
    { input: undefined, expected: false, desc: 'Undefined value' },
    { input: 'file.txt', expected: false, desc: 'Wrong extension' },
    { input: 'file', expected: false, desc: 'No extension' },
    { input: 'file..json', expected: false, desc: 'Double dots' },
    { input: '.json', expected: false, desc: 'No basename' },
    { input: '../file.json', expected: false, desc: 'Path traversal attempt' },
    { input: 'file with spaces.json', expected: false, desc: 'Spaces in filename' },
    { input: 'file@name.json', expected: false, desc: 'Special characters' },
    { input: 'file/name.json', expected: false, desc: 'Forward slash' },
    { input: 'a'.repeat(100) + '.json', expected: false, desc: 'Too long' },
  ];

  let passed = 0;
  let failed = 0;

  console.log('Running validateFilename tests...\n');

  for (const test of tests) {
    const result = validateFilename(test.input);
    const success = result.valid === test.expected;
    
    if (success) {
      passed++;
      console.log(`✓ ${test.desc}`);
    } else {
      failed++;
      console.log(`✗ ${test.desc}`);
      console.log(`  Expected: ${test.expected}, Got: ${result.valid}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    }
  }

  // Test getBaseName
  console.log('\nTesting getBaseName...');
  const baseNameTests = [
    { input: 'items.json', expected: 'items' },
    { input: 'my-file.json', expected: 'my-file' },
    { input: 'test', expected: 'test' },
  ];

  for (const test of baseNameTests) {
    const result = getBaseName(test.input);
    if (result === test.expected) {
      passed++;
      console.log(`✓ getBaseName("${test.input}") = "${result}"`);
    } else {
      failed++;
      console.log(`✗ getBaseName("${test.input}") expected "${test.expected}", got "${result}"`);
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  return failed === 0;
}

// Run tests
const success = runTests();
process.exit(success ? 0 : 1);
