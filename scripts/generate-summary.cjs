#!/usr/bin/env node

const fs = require('node:fs');

// Extract package name from override key, handling scoped packages and version specifiers
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

// Generate markdown summary of override changes
function generateSummary() {
	let summary = '# pnpm Overrides Management Summary\n\n';
	summary +=
		'The following changes occurred after managing pnpm overrides and running `pnpm audit --fix`:\n\n';

	// Add removed overrides section if the file exists
	if (fs.existsSync('removed-overrides.json')) {
		const removed = JSON.parse(
			fs.readFileSync('removed-overrides.json', 'utf8')
		);

		if (
			Object.keys(removed.packageJson).length > 0 ||
			Object.keys(removed.workspace).length > 0
		) {
			summary += '## Previously Removed Overrides\n\n';
			summary +=
				"These overrides were temporarily removed to test if they're still necessary:\n\n";

			const sections = [
				{ title: 'From package.json:', data: removed.packageJson },
				{ title: 'From pnpm-workspace.yaml:', data: removed.workspace }
			];

			for (const { title, data } of sections) {
				if (Object.keys(data).length > 0) {
					summary += `### ${title}\n\n`;
					for (const [pkg, version] of Object.entries(data)) {
						summary += `- [\`${pkg}\`](https://npmjs.com/package/${encodeURIComponent(extractPackageName(pkg))}): \`${version}\`\n`;
					}

					summary += '\n';
				}
			}
		}
	}

	// Add changed files section
	summary += '## Changed Files\n\n';
	try {
		const { execSync } = require('node:child_process');
		const changedFiles = execSync('git diff --name-only', {
			encoding: 'utf8'
		}).trim();
		const stagedFiles = execSync('git diff --cached --name-only', {
			encoding: 'utf8'
		}).trim();

		if (changedFiles) {
			summary += changedFiles + '\n';
		}

		if (stagedFiles) {
			summary += stagedFiles + '\n';
		}
	} catch {
		summary += 'Error getting changed files\n';
	}

	summary += '\n## Summary\n\n';
	summary += '- Removed overrides from configuration files\n';
	summary += '- Ran `pnpm install` to update lockfile\n';
	summary += '- Ran `pnpm audit --fix` to apply available fixes\n\n';
	summary +=
		'This suggests that the overrides are no longer necessary as pnpm can now resolve dependencies and fix vulnerabilities without them.\n';

	return summary;
}

// Write summary to file
const summaryContent = generateSummary();
fs.writeFileSync('override-removal-summary.md', summaryContent);

console.log('Generated override removal summary');
