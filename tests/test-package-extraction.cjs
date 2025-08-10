#!/usr/bin/env node

const process = require('node:process');

// Test the package name extraction logic
function extractPackageName(overrideKey) {
	// Handle scoped packages like @types/node, @babel/core, etc.
	if (overrideKey.startsWith('@')) {
		// Find the second @ which would indicate a version specifier
		const parts = overrideKey.split('@');
		if (parts.length === 2) {
			// Only scope and package name, no version (e.g., "@types/node")
			return overrideKey;
		}

		if (parts.length >= 3) {
			// Scope, package name, and version (e.g., "@types/node@18.0.0")
			return `@${parts[1]}`;
		}
	} else {
		// Non-scoped packages - split on @ and take the first part
		return overrideKey.split('@')[0];
	}

	// Fallback - return the original key
	return overrideKey;
}

// Test cases
const testCases = [
	// Regular packages
	{ input: 'lodash', expected: 'lodash' },
	{ input: 'lodash@4.17.21', expected: 'lodash' },
	{ input: 'react@^18.0.0', expected: 'react' },

	// Scoped packages without version
	{ input: '@types/node', expected: '@types/node' },
	{ input: '@babel/core', expected: '@babel/core' },
	{ input: '@vue/cli', expected: '@vue/cli' },

	// Scoped packages with version
	{ input: '@types/node@18.0.0', expected: '@types/node' },
	{ input: '@babel/core@7.20.0', expected: '@babel/core' },
	{ input: '@vue/cli@^5.0.0', expected: '@vue/cli' },

	// Edge cases
	{ input: '@scope/package@1.0.0@beta', expected: '@scope/package' }
];

console.log('Testing package name extraction logic...\n');

let passed = 0;
let failed = 0;

for (const { input, expected } of testCases) {
	const result = extractPackageName(input);
	const success = result === expected;

	if (success) {
		console.log(`✓ "${input}" → "${result}"`);
		passed++;
	} else {
		console.log(`❌ "${input}" → "${result}" (expected "${expected}")`);
		failed++;
	}
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);

if (failed === 0) {
	console.log('🎉 All package name extraction tests passed!');
} else {
	process.exit(1);
}
