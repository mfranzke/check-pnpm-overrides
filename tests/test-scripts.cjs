#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const process = require('node:process');

// Test utilities
function assertEquals(actual, expected, message) {
	if (JSON.stringify(actual) !== JSON.stringify(expected)) {
		throw new Error(
			`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`
		);
	}

	console.log(`✓ ${message}`);
}

function assertTrue(condition, message) {
	if (!condition) {
		throw new Error(`${message}\nExpected: true\nActual: false`);
	}

	console.log(`✓ ${message}`);
}

function _assertFalse(condition, message) {
	if (condition) {
		throw new Error(`${message}\nExpected: false\nActual: true`);
	}

	console.log(`✓ ${message}`);
}

// Test setup
const scriptsDir = path.join(__dirname, '..', 'scripts');
const fixturesDir = path.join(__dirname, 'fixtures');
const temporaryDir = path.join(__dirname, 'temp');

function setupTemporaryDir() {
	if (fs.existsSync(temporaryDir)) {
		fs.rmSync(temporaryDir, { recursive: true });
	}

	fs.mkdirSync(temporaryDir, { recursive: true });
	process.chdir(temporaryDir);
}

function cleanupTemporaryDir() {
	process.chdir(__dirname);
	if (fs.existsSync(temporaryDir)) {
		fs.rmSync(temporaryDir, { recursive: true });
	}
}

// Test cases
function testRemoveOverridesScript() {
	console.log('\n=== Testing remove-overrides.cjs ===');

	setupTemporaryDir();

	// Test 1: Remove overrides from package.json with overrides
	fs.copyFileSync(
		path.join(fixturesDir, 'package-with-overrides.json'),
		'package.json'
	);

	execSync(`node ${path.join(scriptsDir, 'remove-overrides.cjs')}`);

	const result = JSON.parse(fs.readFileSync('package.json', 'utf8'));
	assertTrue(
		!Object.hasOwn(result, 'overrides'),
		'Should remove overrides property from package.json'
	);
	assertEquals(
		result.name,
		'test-project',
		'Should preserve other properties'
	);

	// Test 2: Handle package.json without overrides gracefully
	fs.copyFileSync(
		path.join(fixturesDir, 'package-without-overrides.json'),
		'package.json'
	);

	execSync(`node ${path.join(scriptsDir, 'remove-overrides.cjs')}`);

	const result2 = JSON.parse(fs.readFileSync('package.json', 'utf8'));
	assertTrue(
		!Object.hasOwn(result2, 'overrides'),
		'Should handle missing overrides gracefully'
	);
	assertEquals(
		result2.name,
		'test-project',
		'Should preserve other properties'
	);

	// Test 3: Remove overrides from pnpm-workspace.yaml with overrides
	fs.copyFileSync(
		path.join(fixturesDir, 'package-without-overrides.json'),
		'package.json'
	);
	fs.copyFileSync(
		path.join(fixturesDir, 'pnpm-workspace-with-overrides.yaml'),
		'pnpm-workspace.yaml'
	);

	execSync(`node ${path.join(scriptsDir, 'remove-overrides.cjs')}`);

	const workspaceContent = fs.readFileSync('pnpm-workspace.yaml', 'utf8');
	const yaml = require('js-yaml');
	const workspace = yaml.load(workspaceContent);
	assertTrue(
		!Object.hasOwn(workspace, 'overrides'),
		'Should remove overrides property from pnpm-workspace.yaml'
	);
	assertTrue(
		Array.isArray(workspace.packages),
		'Should preserve packages array'
	);

	// Test 4: Handle pnpm-workspace.yaml without overrides
	fs.copyFileSync(
		path.join(fixturesDir, 'pnpm-workspace-without-overrides.yaml'),
		'pnpm-workspace.yaml'
	);

	execSync(`node ${path.join(scriptsDir, 'remove-overrides.cjs')}`);

	const workspaceContent2 = fs.readFileSync('pnpm-workspace.yaml', 'utf8');
	const workspace2 = yaml.load(workspaceContent2);
	assertTrue(
		!Object.hasOwn(workspace2, 'overrides'),
		'Should handle missing overrides in workspace gracefully'
	);
	assertTrue(
		Array.isArray(workspace2.packages),
		'Should preserve packages array'
	);

	// Test 5: Handle both files with overrides
	fs.copyFileSync(
		path.join(fixturesDir, 'package-with-overrides.json'),
		'package.json'
	);
	fs.copyFileSync(
		path.join(fixturesDir, 'pnpm-workspace-with-overrides.yaml'),
		'pnpm-workspace.yaml'
	);

	execSync(`node ${path.join(scriptsDir, 'remove-overrides.cjs')}`);

	const result5 = JSON.parse(fs.readFileSync('package.json', 'utf8'));
	const workspaceContent5 = fs.readFileSync('pnpm-workspace.yaml', 'utf8');
	const workspace5 = yaml.load(workspaceContent5);

	assertTrue(
		!Object.hasOwn(result5, 'overrides'),
		'Should remove overrides from both package.json'
	);
	assertTrue(
		!Object.hasOwn(workspace5, 'overrides'),
		'Should remove overrides from both pnpm-workspace.yaml'
	);

	cleanupTemporaryDir();
}

function testGenerateSummaryScript() {
	console.log('\n=== Testing generate-summary.cjs ===');

	setupTemporaryDir();

	// Initialize a git repo for testing
	execSync('git init');
	execSync('git config user.name "Test User"');
	execSync('git config user.email "test@example.com"');

	// Create test data files with various package name formats
	fs.writeFileSync(
		'removed-overrides.json',
		JSON.stringify({
			packageJson: {
				lodash: '^4.17.21',
				'@types/node': '^18.0.0',
				'@babel/core@7.20.0': '^7.21.0'
			},
			workspace: {
				react: '^18.0.0',
				'@vue/cli': '^5.0.0'
			}
		})
	);

	// Create some changes to test git diff
	fs.writeFileSync('package.json', '{"name": "test"}');
	execSync('git add .');
	execSync('git commit -m "Initial"');
	fs.writeFileSync('package.json', '{"name": "test-modified"}');

	// Run the generate summary script
	execSync(`node ${path.join(scriptsDir, 'generate-summary.cjs')}`);

	// Check that the summary file was created
	assertTrue(
		fs.existsSync('override-removal-summary.md'),
		'Should create summary file'
	);

	const summaryContent = fs.readFileSync(
		'override-removal-summary.md',
		'utf8'
	);

	// Verify content includes the expected sections
	assertTrue(
		summaryContent.includes('# pnpm Overrides Management Summary'),
		'Should have main heading'
	);
	assertTrue(
		summaryContent.includes('## Previously Removed Overrides'),
		'Should have removed overrides section'
	);
	assertTrue(
		summaryContent.includes('### From package.json:'),
		'Should list package.json overrides'
	);
	assertTrue(
		summaryContent.includes('### From pnpm-workspace.yaml:'),
		'Should list workspace overrides'
	);
	assertTrue(
		summaryContent.includes('lodash'),
		'Should mention lodash override'
	);
	assertTrue(
		summaryContent.includes('@types/node'),
		'Should mention @types/node override'
	);
	assertTrue(
		summaryContent.includes('@babel/core'),
		'Should mention @babel/core override'
	);
	assertTrue(
		summaryContent.includes('react'),
		'Should mention react override'
	);
	assertTrue(
		summaryContent.includes('@vue/cli'),
		'Should mention @vue/cli override'
	);
	assertTrue(
		summaryContent.includes('https://npmjs.com/package/lodash'),
		'Should link to lodash package'
	);
	assertTrue(
		summaryContent.includes('https://npmjs.com/package/%40types%2Fnode'),
		'Should link to @types/node package with proper encoding'
	);
	assertTrue(
		summaryContent.includes('## Changed Files'),
		'Should have changed files section'
	);
	assertTrue(
		summaryContent.includes('## Summary'),
		'Should have summary section'
	);

	cleanupTemporaryDir();
}

function testIntegration() {
	console.log('\n=== Testing Integration ===');

	setupTemporaryDir();

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
	execSync(`node ${path.join(scriptsDir, 'remove-overrides.cjs')}`);

	const finalPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
	assertTrue(
		!Object.hasOwn(finalPackage, 'overrides'),
		'Integration: Should successfully remove overrides'
	);

	// Check if git detects changes
	const gitStatus = execSync('git status --porcelain').toString();
	assertTrue(
		gitStatus.includes('package.json'),
		'Integration: Git should detect changes to package.json'
	);

	cleanupTemporaryDir();
}

// Run all tests
function runTests() {
	console.log('🧪 Running GitHub Action Tests...\n');

	try {
		testRemoveOverridesScript();
		testGenerateSummaryScript();
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
	testGenerateSummaryScript,
	testIntegration
};
