#!/usr/bin/env node

const process = require('node:process');

const { lintActionYmlStructure } = require('./lint-action-yml.cjs');
const {
	testRemoveOverridesScript,
	testGenerateSummaryScript,
	testIntegration
} = require('./test-scripts.cjs');

const testSuites = {
	action: {
		name: 'Action YAML Structure',
		fn: lintActionYmlStructure
	},
	remove: {
		name: 'Remove Overrides Script',
		fn: testRemoveOverridesScript
	},
	summary: {
		name: 'Generate Summary Script',
		fn: testGenerateSummaryScript
	},
	integration: {
		name: 'Integration Tests',
		fn: testIntegration
	}
};

function showHelp() {
	console.log('Usage: node test-runner.cjs [test-name]');
	console.log('\nAvailable tests:');
	for (const [key, suite] of Object.entries(testSuites)) {
		console.log(`  ${key.padEnd(12)} - ${suite.name}`);
	}

	console.log('  all           - Run all tests (default)');
	console.log('\nExamples:');
	console.log('  node test-runner.cjs action');
	console.log('  node test-runner.cjs remove');
	console.log('  node test-runner.cjs');
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
	require('./run-tests.cjs').runAllTests();
} else if (testName === 'help' || testName === '-h' || testName === '--help') {
	showHelp();
} else {
	runTest(testName);
}
