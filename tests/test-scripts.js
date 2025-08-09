#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// Test utilities
function assertEquals(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
  console.log(`✓ ${message}`);
}

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(`${message}\nExpected: true\nActual: false`);
  }
  console.log(`✓ ${message}`);
}

function assertFalse(condition, message) {
  if (condition) {
    throw new Error(`${message}\nExpected: false\nActual: true`);
  }
  console.log(`✓ ${message}`);
}

// Test setup
const scriptsDir = path.join(__dirname, '..', 'scripts');
const fixturesDir = path.join(__dirname, 'fixtures');
const tempDir = path.join(__dirname, 'temp');

function setupTempDir() {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });
  process.chdir(tempDir);
}

function cleanupTempDir() {
  process.chdir(__dirname);
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
}

// Test cases
function testRemoveOverridesScript() {
  console.log('\n=== Testing remove-overrides.js ===');
  
  setupTempDir();
  
  // Test 1: Remove overrides from package.json with overrides
  fs.copyFileSync(
    path.join(fixturesDir, 'package-with-overrides.json'),
    'package.json'
  );
  
  execSync(`node ${path.join(scriptsDir, 'remove-overrides.js')}`);
  
  const result = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assertTrue(!result.hasOwnProperty('overrides'), 'Should remove overrides property');
  assertEquals(result.name, 'test-project', 'Should preserve other properties');
  
  // Test 2: Handle package.json without overrides gracefully
  fs.copyFileSync(
    path.join(fixturesDir, 'package-without-overrides.json'),
    'package.json'
  );
  
  execSync(`node ${path.join(scriptsDir, 'remove-overrides.js')}`);
  
  const result2 = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assertTrue(!result2.hasOwnProperty('overrides'), 'Should handle missing overrides gracefully');
  assertEquals(result2.name, 'test-project', 'Should preserve other properties');
  
  cleanupTempDir();
}

function testCompareAuditsScript() {
  console.log('\n=== Testing compare-audits.js ===');
  
  setupTempDir();
  
  // Mock GITHUB_OUTPUT
  const outputFile = path.join(tempDir, 'github_output');
  process.env.GITHUB_OUTPUT = outputFile;
  
  // Test 1: Overrides fix vulnerabilities (should recommend removal)
  fs.copyFileSync(
    path.join(fixturesDir, 'audit-with-vulnerabilities.json'),
    'audit-with.json'
  );
  fs.copyFileSync(
    path.join(fixturesDir, 'audit-clean.json'),
    'audit-without.json'
  );
  
  execSync(`node ${path.join(scriptsDir, 'compare-audits.js')}`);
  
  const output1 = fs.readFileSync(outputFile, 'utf8');
  assertTrue(output1.includes('can_remove_overrides=true'), 'Should recommend removing overrides when they fix issues');
  
  const diffContent1 = fs.readFileSync('audit-diff.txt', 'utf8');
  assertTrue(diffContent1.includes('lodash@<4.17.21'), 'Should show removed vulnerabilities');
  
  // Test 2: Overrides don't help (should not recommend removal)
  fs.writeFileSync(outputFile, ''); // Clear output file
  fs.copyFileSync(
    path.join(fixturesDir, 'audit-with-vulnerabilities.json'),
    'audit-with.json'
  );
  fs.copyFileSync(
    path.join(fixturesDir, 'audit-with-vulnerabilities.json'),
    'audit-without.json'
  );
  
  execSync(`node ${path.join(scriptsDir, 'compare-audits.js')}`);
  
  const output2 = fs.readFileSync(outputFile, 'utf8');
  assertTrue(output2.includes('can_remove_overrides=false'), 'Should not recommend removing overrides when they don\'t help');
  
  // Test 3: Both audits are clean
  fs.writeFileSync(outputFile, ''); // Clear output file
  fs.copyFileSync(
    path.join(fixturesDir, 'audit-clean.json'),
    'audit-with.json'
  );
  fs.copyFileSync(
    path.join(fixturesDir, 'audit-clean.json'),
    'audit-without.json'
  );
  
  execSync(`node ${path.join(scriptsDir, 'compare-audits.js')}`);
  
  const output3 = fs.readFileSync(outputFile, 'utf8');
  assertTrue(output3.includes('can_remove_overrides=false'), 'Should not recommend removing overrides when no issues exist');
  
  // Test 4: Handle missing/malformed files
  fs.writeFileSync(outputFile, ''); // Clear output file
  fs.writeFileSync('audit-with.json', 'invalid json');
  fs.writeFileSync('audit-without.json', '{}');
  
  execSync(`node ${path.join(scriptsDir, 'compare-audits.js')}`);
  
  const output4 = fs.readFileSync(outputFile, 'utf8');
  assertTrue(output4.includes('can_remove_overrides=false'), 'Should handle malformed JSON gracefully');
  
  cleanupTempDir();
}

function testIntegration() {
  console.log('\n=== Testing Integration ===');
  
  setupTempDir();
  
  // Test full workflow
  fs.copyFileSync(
    path.join(fixturesDir, 'package-with-overrides.json'),
    'package.json'
  );
  fs.copyFileSync(
    path.join(fixturesDir, 'package-with-overrides.json'),
    'package.json.bak'
  );
  
  // Mock GITHUB_OUTPUT
  const outputFile = path.join(tempDir, 'github_output');
  process.env.GITHUB_OUTPUT = outputFile;
  
  // Simulate audit results that show overrides are no longer needed
  // WITH overrides: still has the old vulnerabilities that overrides were meant to fix
  // WITHOUT overrides: those vulnerabilities are now fixed upstream, so clean
  fs.copyFileSync(
    path.join(fixturesDir, 'audit-with-vulnerabilities.json'),
    'audit-with.json'
  );
  fs.copyFileSync(
    path.join(fixturesDir, 'audit-clean.json'), 
    'audit-without.json'
  );
  
  // Run compare script
  execSync(`node ${path.join(scriptsDir, 'compare-audits.js')}`);
  
  // Verify output
  const output = fs.readFileSync(outputFile, 'utf8');
  assertTrue(output.includes('can_remove_overrides=true'), 'Integration: Should detect overrides are beneficial for removal');
  
  // Run remove overrides script
  execSync(`node ${path.join(scriptsDir, 'remove-overrides.js')}`);
  
  const finalPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assertTrue(!finalPackage.hasOwnProperty('overrides'), 'Integration: Should successfully remove overrides');
  
  // Restore from backup
  execSync('mv package.json.bak package.json');
  
  const restoredPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assertTrue(restoredPackage.hasOwnProperty('overrides'), 'Integration: Should restore from backup');
  
  cleanupTempDir();
}

// Run all tests
function runTests() {
  console.log('🧪 Running GitHub Action Tests...\n');
  
  try {
    testRemoveOverridesScript();
    testCompareAuditsScript();
    testIntegration();
    
    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testRemoveOverridesScript,
  testCompareAuditsScript,
  testIntegration
};
