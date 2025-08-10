#!/usr/bin/env node

const fs = require('node:fs');
const yaml = require('js-yaml');

const removedOverrides = {
	packageJson: {},
	workspace: {}
};

// Handle package.json overrides
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
let packageJsonModified = false;

if (pkg.overrides) {
	removedOverrides.packageJson = { ...pkg.overrides };
	delete pkg.overrides;
	fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
	packageJsonModified = true;
}

// Handle pnpm-workspace.yaml overrides
let workspaceModified = false;
const workspaceFile = 'pnpm-workspace.yaml';

if (fs.existsSync(workspaceFile)) {
	try {
		const workspaceContent = fs.readFileSync(workspaceFile, 'utf8');
		const workspace = yaml.load(workspaceContent);

		if (workspace && workspace.overrides) {
			removedOverrides.workspace = { ...workspace.overrides };
			delete workspace.overrides;
			fs.writeFileSync(workspaceFile, yaml.dump(workspace));
			workspaceModified = true;
		}
	} catch (error) {
		console.warn(
			`Warning: Could not parse ${workspaceFile}:`,
			error.message
		);
	}
}

// Output results for consumption by the GitHub Action
if (packageJsonModified || workspaceModified) {
	// Write removed overrides to a file for the action to read
	fs.writeFileSync(
		'removed-overrides.json',
		JSON.stringify(removedOverrides, null, 2)
	);

	if (packageJsonModified) {
		console.log('Removed overrides from package.json');
	}

	if (workspaceModified) {
		console.log('Removed overrides from pnpm-workspace.yaml');
	}
} else {
	console.log('No overrides found in package.json or pnpm-workspace.yaml');
}
