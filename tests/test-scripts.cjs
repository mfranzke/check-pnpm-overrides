#!/usr/bin/env node

// SPDX-FileCopyrightText: 2025 Maximilian Franzke <mfr@nzke.net>
//
// SPDX-License-Identifier: MIT

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const process = require('node:process');
const yaml = require('js-yaml');

function assertTrue(condition, message) {
	if (!condition) {
		throw new Error(`${message}\nExpected: true\nActual: false`);
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

	// Test 1: Remove overrides and minimumReleaseAgeExclude from pnpm-workspace.yaml
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
	const workspace = yaml.load(workspaceContent);
	assertTrue(
		!Object.hasOwn(workspace, 'overrides'),
		'Should remove overrides property from pnpm-workspace.yaml'
	);
	assertTrue(
		!Object.hasOwn(workspace, 'minimumReleaseAgeExclude'),
		'Should remove minimumReleaseAgeExclude from pnpm-workspace.yaml'
	);
	assertTrue(
		Array.isArray(workspace.packages),
		'Should preserve packages array'
	);
	assertTrue(
		fs.existsSync('removed-overrides.json'),
		'Should write removed-overrides.json when entries are removed'
	);

	const removedEntries = JSON.parse(
		fs.readFileSync('removed-overrides.json', 'utf8')
	);
	assertTrue(
		Object.keys(removedEntries.workspace.overrides).length > 0,
		'Should store removed workspace overrides'
	);
	assertTrue(
		removedEntries.workspace.minimumReleaseAgeExclude.length > 0,
		'Should store removed minimumReleaseAgeExclude entries'
	);

	// Test 2: Handle pnpm-workspace.yaml without overrides
	fs.rmSync('removed-overrides.json', { force: true });
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
	assertTrue(
		!fs.existsSync('removed-overrides.json'),
		'Should not write removed-overrides.json when nothing is removed'
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
			workspace: {
				overrides: {
					lodash: '^4.17.21',
					'@types/node': '^18.0.0',
					'@babel/core@7.20.0': '^7.21.0'
				},
				minimumReleaseAgeExclude: [
					'GHSA-35jh-r3h4-6jhm',
					'GHSA-67mh-4wv8-2f99'
				]
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
		summaryContent.includes('### Overrides from pnpm-workspace.yaml'),
		'Should list workspace overrides'
	);
	assertTrue(
		summaryContent.includes(
			'### minimumReleaseAgeExclude from pnpm-workspace.yaml'
		),
		'Should list minimumReleaseAgeExclude entries'
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
		summaryContent.includes('GHSA-35jh-r3h4-6jhm'),
		'Should mention minimumReleaseAgeExclude GHSA entries'
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
	assertTrue(
		summaryContent.includes('pnpm audit --fix=override'),
		'Should mention pnpm audit --fix=override'
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
		path.join(fixturesDir, 'package-without-overrides.json'),
		'package.json'
	);
	fs.copyFileSync(
		path.join(fixturesDir, 'pnpm-workspace-with-overrides.yaml'),
		'pnpm-workspace.yaml'
	);

	// Add initial commit
	execSync('git add .');
	execSync('git commit -m "Initial commit"');

	// Run remove overrides script
	execSync(`node ${path.join(scriptsDir, 'remove-overrides.cjs')}`);

	const workspaceContent = fs.readFileSync('pnpm-workspace.yaml', 'utf8');
	const finalWorkspace = yaml.load(workspaceContent);
	assertTrue(
		!Object.hasOwn(finalWorkspace, 'overrides'),
		'Integration: Should successfully remove workspace overrides'
	);
	assertTrue(
		!Object.hasOwn(finalWorkspace, 'minimumReleaseAgeExclude'),
		'Integration: Should successfully clear minimumReleaseAgeExclude'
	);

	// Check if git detects changes
	const gitStatus = execSync('git status --porcelain').toString();
	assertTrue(
		gitStatus.includes('pnpm-workspace.yaml'),
		'Integration: Git should detect changes to pnpm-workspace.yaml'
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
