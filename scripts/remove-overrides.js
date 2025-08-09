#!/usr/bin/env node

const fs = require('node:fs');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (pkg.overrides) {
  delete pkg.overrides;
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
}
