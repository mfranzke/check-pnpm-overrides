#!/usr/bin/env node

const fs = require('node:fs');

function readAudit(path) {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (e) {
    return {};
  }
}

const withOverrides = readAudit('audit-with.json');
const withoutOverrides = readAudit('audit-without.json');

function summarize(audit) {
  return audit.advisories
    ? Object.values(audit.advisories).map(a => `${a.module_name}@${a.vulnerable_versions}`).sort()
    : [];
}

const sumWith = summarize(withOverrides);
const sumWithout = summarize(withoutOverrides);

const removedIssues = sumWith.filter(x => !sumWithout.includes(x));
const newIssues = sumWithout.filter(x => !sumWith.includes(x));

fs.writeFileSync('audit-diff.txt', [
  '=== Removed Issues (now fixed upstream) ===',
  ...removedIssues,
  '',
  '=== New Issues (appear without overrides) ===',
  ...newIssues
].join('\n'));

console.log(fs.readFileSync('audit-diff.txt', 'utf8'));

if (removedIssues.length > 0 && newIssues.length === 0) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, 'can_remove_overrides=true\n');
} else {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, 'can_remove_overrides=false\n');
}
