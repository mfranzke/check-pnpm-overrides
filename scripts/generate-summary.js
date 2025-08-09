#!/usr/bin/env node

const fs = require('node:fs');

// Generate markdown summary of override removal
function generateSummary() {
  let summary = "# pnpm Overrides Removal Summary\n\n";
  summary += "The following changes occurred after removing pnpm overrides and running `pnpm audit --fix`:\n\n";
  
  // Add removed overrides section if the file exists
  if (fs.existsSync('removed-overrides.json')) {
    const removed = JSON.parse(fs.readFileSync('removed-overrides.json', 'utf8'));
    
    if (Object.keys(removed.packageJson).length > 0 || Object.keys(removed.workspace).length > 0) {
      summary += "## Removed Overrides\n\n";
      
      if (Object.keys(removed.packageJson).length > 0) {
        summary += "### From package.json:\n\n";
        for (const [pkg, version] of Object.entries(removed.packageJson)) {
          summary += `- \`${pkg}\`: \`${version}\`\n`;
        }
        summary += "\n";
      }
      
      if (Object.keys(removed.workspace).length > 0) {
        summary += "### From pnpm-workspace.yaml:\n\n";
        for (const [pkg, version] of Object.entries(removed.workspace)) {
          summary += `- \`${pkg}\`: \`${version}\`\n`;
        }
        summary += "\n";
      }
    }
  }
  
  // Add changed files section
  summary += "## Changed Files\n\n";
  try {
    const { execSync } = require('child_process');
    const changedFiles = execSync('git diff --name-only', { encoding: 'utf8' }).trim();
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
    
    if (changedFiles) {
      summary += changedFiles + "\n";
    }
    if (stagedFiles) {
      summary += stagedFiles + "\n";
    }
  } catch (error) {
    summary += "Error getting changed files\n";
  }
  
  summary += "\n## Summary\n\n";
  summary += "- Removed overrides from configuration files\n";
  summary += "- Ran `pnpm install` to update lockfile\n";
  summary += "- Ran `pnpm audit --fix` to apply available fixes\n\n";
  summary += "This suggests that the overrides are no longer necessary as pnpm can now resolve dependencies and fix vulnerabilities without them.\n";
  
  return summary;
}

// Write summary to file
const summaryContent = generateSummary();
fs.writeFileSync('override-removal-summary.md', summaryContent);

console.log('Generated override removal summary');
