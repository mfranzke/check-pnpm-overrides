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
  assertTrue(!result.hasOwnProperty('overrides'), 'Should remove overrides property from package.json');
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
  
  // Test 3: Remove overrides from pnpm-workspace.yaml with overrides
  fs.copyFileSync(
    path.join(fixturesDir, 'package-without-overrides.json'),
    'package.json'
  );
  fs.copyFileSync(
    path.join(fixturesDir, 'pnpm-workspace-with-overrides.yaml'),
    'pnpm-workspace.yaml'
  );
  
  execSync(`node ${path.join(scriptsDir, 'remove-overrides.js')}`);
  
  const workspaceContent = fs.readFileSync('pnpm-workspace.yaml', 'utf8');
  const yaml = require('js-yaml');
  const workspace = yaml.load(workspaceContent);
  assertTrue(!workspace.hasOwnProperty('overrides'), 'Should remove overrides property from pnpm-workspace.yaml');
  assertTrue(Array.isArray(workspace.packages), 'Should preserve packages array');
  
  // Test 4: Handle pnpm-workspace.yaml without overrides
  fs.copyFileSync(
    path.join(fixturesDir, 'pnpm-workspace-without-overrides.yaml'),
    'pnpm-workspace.yaml'
  );
  
  execSync(`node ${path.join(scriptsDir, 'remove-overrides.js')}`);
  
  const workspaceContent2 = fs.readFileSync('pnpm-workspace.yaml', 'utf8');
  const workspace2 = yaml.load(workspaceContent2);
  assertTrue(!workspace2.hasOwnProperty('overrides'), 'Should handle missing overrides in workspace gracefully');
  assertTrue(Array.isArray(workspace2.packages), 'Should preserve packages array');
  
  // Test 5: Handle both files with overrides
  fs.copyFileSync(
    path.join(fixturesDir, 'package-with-overrides.json'),
    'package.json'
  );
  fs.copyFileSync(
    path.join(fixturesDir, 'pnpm-workspace-with-overrides.yaml'),
    'pnpm-workspace.yaml'
  );
  
  execSync(`node ${path.join(scriptsDir, 'remove-overrides.js')}`);
  
  const result5 = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const workspaceContent5 = fs.readFileSync('pnpm-workspace.yaml', 'utf8');
  const workspace5 = yaml.load(workspaceContent5);
  
  assertTrue(!result5.hasOwnProperty('overrides'), 'Should remove overrides from both package.json');
  assertTrue(!workspace5.hasOwnProperty('overrides'), 'Should remove overrides from both pnpm-workspace.yaml');
  
  cleanupTempDir();
}

function testIntegration() {
  console.log('\n=== Testing Integration ===');
  
  setupTempDir();
  
  // Initialize a git repo for testing
  execSync('git init');
  execSync('git config user.name "Test User"');
  execSync('git config user.email "test@example.com"');
  
  // Test full workflow
  fs.copyFileSync(
    path.join(fixturesDir, 'package-with-overrides.json'),
    'package.json'
  );
  
  // Add initial commit
  execSync('git add .');
  execSync('git commit -m "Initial commit"');
  
  // Run remove overrides script
  execSync(`node ${path.join(scriptsDir, 'remove-overrides.js')}`);
  
  const finalPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assertTrue(!finalPackage.hasOwnProperty('overrides'), 'Integration: Should successfully remove overrides');
  
  // Check if git detects changes
  const gitStatus = execSync('git status --porcelain').toString();
  assertTrue(gitStatus.includes('package.json'), 'Integration: Git should detect changes to package.json');
  
  cleanupTempDir();
}

// Run all tests
function runTests() {
  console.log('🧪 Running GitHub Action Tests...\n');
  
  try {
    testRemoveOverridesScript();
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
  testIntegration
};
