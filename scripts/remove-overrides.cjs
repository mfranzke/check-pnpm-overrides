#!/usr/bin/env node

// SPDX-FileCopyrightText: 2025 Maximilian Franzke <mfr@nzke.net>
//
// SPDX-License-Identifier: MIT

const fs = require('node:fs');
const yaml = require('js-yaml');

const removedOverrides = {
	workspace: {
		overrides: {},
		minimumReleaseAgeExclude: []
	}
};

// Handle pnpm-workspace.yaml overrides and minimumReleaseAgeExclude
let workspaceModified = false;
const workspaceFile = 'pnpm-workspace.yaml';

if (fs.existsSync(workspaceFile)) {
	try {
		const workspaceContent = fs.readFileSync(workspaceFile, 'utf8');
		const workspace = yaml.load(workspaceContent);

		if (workspace && workspace.overrides) {
			removedOverrides.workspace.overrides = { ...workspace.overrides };
			delete workspace.overrides;
			workspaceModified = true;
		}

		if (
			workspace &&
			Array.isArray(workspace.minimumReleaseAgeExclude) &&
			workspace.minimumReleaseAgeExclude.length > 0
		) {
			removedOverrides.workspace.minimumReleaseAgeExclude = [
				...workspace.minimumReleaseAgeExclude
			];
			delete workspace.minimumReleaseAgeExclude;
			workspaceModified = true;
		}

		if (workspaceModified) {
			fs.writeFileSync(workspaceFile, yaml.dump(workspace));
		}
	} catch (error) {
		console.warn(
			`Warning: Could not parse ${workspaceFile}:`,
			error.message
		);
	}
}

// Output results for consumption by the GitHub Action
if (workspaceModified) {
	// Write removed overrides to a file for the action to read
	fs.writeFileSync(
		'removed-overrides.json',
		JSON.stringify(removedOverrides, null, 2)
	);

	if (Object.keys(removedOverrides.workspace.overrides).length > 0) {
		console.log('Removed overrides from pnpm-workspace.yaml');
	}

	if (removedOverrides.workspace.minimumReleaseAgeExclude.length > 0) {
		console.log(
			'Cleared minimumReleaseAgeExclude from pnpm-workspace.yaml'
		);
	}
} else {
	console.log(
		'No overrides or minimumReleaseAgeExclude found in pnpm-workspace.yaml'
	);
}
