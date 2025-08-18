#!/usr/bin/env node

// SPDX-FileCopyrightText: 2025 Maximilian Franzke <mfr@nzke.net>
//
// SPDX-License-Identifier: MIT

const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');
const yaml = require('js-yaml');

function lintActionYmlStructure() {
	console.log('\n=== Testing action.yml Structure ===');

	const actionPath = path.join(__dirname, '..', 'action.yml');

	// Test 1: File exists and is valid YAML
	if (!fs.existsSync(actionPath)) {
		throw new Error('action.yml file does not exist');
	}

	console.log('✓ action.yml file exists');

	const actionContent = fs.readFileSync(actionPath, 'utf8');
	let action;

	try {
		action = yaml.load(actionContent);
	} catch (error) {
		throw new Error(`action.yml is not valid YAML: ${error.message}`);
	}

	console.log('✓ action.yml is valid YAML');

	// Test 2: Required metadata fields
	const requiredFields = ['name', 'description', 'author', 'runs'];
	for (const field of requiredFields) {
		if (!action[field]) {
			throw new Error(`Missing required field: ${field}`);
		}
	}

	console.log('✓ All required metadata fields present');

	// Test 3: Runs configuration
	if (action.runs.using !== 'composite') {
		throw new Error('Action must use composite runs');
	}

	console.log('✓ Uses composite action type');

	if (!Array.isArray(action.runs.steps)) {
		throw new TypeError('Steps must be an array');
	}

	console.log('✓ Steps is an array');

	// Test 4: All run steps have shell property
	const runSteps = action.runs.steps.filter((step) => step.run);
	for (const step of runSteps) {
		if (!step.shell) {
			throw new Error(`Step "${step.name}" is missing shell property`);
		}
	}

	console.log(`✓ All ${runSteps.length} run steps have shell property`);

	// Test 5: Script references use correct path
	const githubActionPath = 'github.action_path';
	const scriptPathPattern = `\${{ ${githubActionPath} }}/scripts/`;
	const scriptSteps = runSteps.filter(
		(step) => step.run && step.run.includes(scriptPathPattern)
	);

	for (const step of scriptSteps) {
		// Look for script references in the step
		const scriptRegex = new RegExp(
			`\\$\\{\\{ ${githubActionPath} \\}\\}/scripts/([\\S]+\\.js)`,
			'g'
		);
		const scriptMatches = step.run.match(scriptRegex);
		if (scriptMatches) {
			for (const match of scriptMatches) {
				const scriptName = match.replace(scriptPathPattern, '');
				const scriptPath = path.join(
					__dirname,
					'..',
					'scripts',
					scriptName
				);
				if (!fs.existsSync(scriptPath)) {
					throw new Error(
						`Referenced script does not exist: ${scriptPath}`
					);
				}
			}
		}
	}

	console.log(`✓ All ${scriptSteps.length} referenced scripts exist`);

	// Test 6: No deprecated set-output commands
	if (actionContent.includes('::set-output')) {
		throw new Error('Action contains deprecated ::set-output commands');
	}

	console.log('✓ No deprecated ::set-output commands found');

	console.log('✓ action.yml structure validation passed');
}

module.exports = { lintActionYmlStructure };

// Run test if this script is executed directly
if (require.main === module) {
	try {
		lintActionYmlStructure();
		console.log('\n🎉 action.yml validation passed!');
	} catch (error) {
		console.error('\n❌ action.yml validation failed:', error.message);
		process.exit(1);
	}
}
