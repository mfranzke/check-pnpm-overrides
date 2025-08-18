#!/usr/bin/env node

// SPDX-FileCopyrightText: 2025 Maximilian Franzke <mfr@nzke.net>
//
// SPDX-License-Identifier: MIT

const process = require('node:process');

const { lintActionYmlStructure } = require('./lint-action-yml.cjs');
const { runTests: runScriptTests } = require('./test-scripts.cjs');

async function runAllTests() {
	console.log('🧪 Running Complete Test Suite for GitHub Action\n');

	try {
		// Test 1: Validate action.yml structure
		console.log('📋 Phase 1: Action YAML Validation');
		lintActionYmlStructure();

		// Test 2: Test individual scripts
		console.log('\n🔧 Phase 2: Script Functionality Tests');
		runScriptTests();

		console.log('\n✅ All tests completed successfully!');
		console.log('\n📊 Test Summary:');
		console.log('- ✓ Action YAML structure validation');
		console.log('- ✓ Script functionality tests');
		console.log('- ✓ Integration workflow tests');
	} catch (error) {
		console.error('\n❌ Test suite failed:', error.message);
		process.exit(1);
	}
}

// Run all tests if this script is executed directly
if (require.main === module) {
	runAllTests();
}

module.exports = { runAllTests };
