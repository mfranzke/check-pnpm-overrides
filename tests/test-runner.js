#!/usr/bin/env node

const { lintActionYmlStructure } = require('./lint-action-yml');
const { testRemoveOverridesScript, testCompareAuditsScript, testIntegration } = require('./test-scripts');

const testSuites = {
  'action': {
    name: 'Action YAML Structure',
    fn: lintActionYmlStructure
  },
  'remove': {
    name: 'Remove Overrides Script',
    fn: testRemoveOverridesScript
  },
  'compare': {
    name: 'Compare Audits Script', 
    fn: testCompareAuditsScript
  },
  'integration': {
    name: 'Integration Tests',
    fn: testIntegration
  }
};

function showHelp() {
  console.log('Usage: node test-runner.js [test-name]');
  console.log('\nAvailable tests:');
  Object.entries(testSuites).forEach(([key, suite]) => {
    console.log(`  ${key.padEnd(12)} - ${suite.name}`);
  });
  console.log('  all           - Run all tests (default)');
  console.log('\nExamples:');
  console.log('  node test-runner.js action');
  console.log('  node test-runner.js remove');
  console.log('  node test-runner.js');
}

function runTest(testName) {
  const suite = testSuites[testName];
  if (!suite) {
    console.error(`❌ Unknown test: ${testName}`);
    showHelp();
    process.exit(1);
  }
  
  console.log(`🧪 Running: ${suite.name}`);
  try {
    suite.fn();
    console.log(`✅ ${suite.name} passed!`);
  } catch (error) {
    console.error(`❌ ${suite.name} failed:`, error.message);
    process.exit(1);
  }
}

const testName = process.argv[2];

if (!testName || testName === 'all') {
  // Run all tests
  require('./run-tests').runAllTests();
} else if (testName === 'help' || testName === '-h' || testName === '--help') {
  showHelp();
} else {
  runTest(testName);
}
