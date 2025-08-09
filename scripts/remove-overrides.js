#!/usr/bin/env node

const fs = require('node:fs');
const yaml = require('js-yaml');

// Handle package.json overrides
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
let packageJsonModified = false;

if (pkg.overrides) {
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
      delete workspace.overrides;
      fs.writeFileSync(workspaceFile, yaml.dump(workspace));
      workspaceModified = true;
    }
  } catch (error) {
    console.warn(`Warning: Could not parse ${workspaceFile}:`, error.message);
  }
}

if (packageJsonModified) {
  console.log('Removed overrides from package.json');
}
if (workspaceModified) {
  console.log('Removed overrides from pnpm-workspace.yaml');
}
if (!packageJsonModified && !workspaceModified) {
  console.log('No overrides found in package.json or pnpm-workspace.yaml');
}
