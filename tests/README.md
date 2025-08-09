# Tests for check-pnpm-overrides Action

This directory contains comprehensive tests for the GitHub Action.

## Test Structure

- `test-scripts.js` - Tests individual JavaScript scripts
- `test-action-yml.js` - Validates action.yml structure  
- `run-tests.js` - Main test runner
- `test-runner.js` - Development test runner for individual components
- `fixtures/` - Test data files

## Running Tests

```bash
# Install dependencies
pnpm install

# Run all tests
pnpm test

# Run specific test suites
pnpm run test:scripts  # Test JavaScript scripts only
pnpm run test:action   # Test action.yml only

# Development test runner (for debugging individual components)
pnpm run test:dev action      # Test only action.yml structure
pnpm run test:dev remove      # Test only remove-overrides.js
pnpm run test:dev integration # Test only integration workflow
pnpm run test:dev help        # Show available options
```

## Test Coverage

### Script Tests (`test-scripts.js`)
- ✅ `remove-overrides.js` functionality for both package.json and pnpm-workspace.yaml
- ✅ Integration workflow testing with git change detection
- ✅ Error handling scenarios

### Action YAML Tests (`test-action-yml.js`)
- ✅ YAML syntax validation
- ✅ Required metadata fields
- ✅ Composite action structure
- ✅ Shell properties on all run steps
- ✅ Script file references
- ✅ No deprecated commands

### Fixtures
- `package-with-overrides.json` - Sample package.json with overrides
- `package-without-overrides.json` - Sample package.json without overrides
- `audit-with-vulnerabilities.json` - Sample audit with security issues
- `audit-clean.json` - Sample clean audit results

## CI/CD

Tests automatically run on:
- Push to main branch
- Pull requests
- Via GitHub Actions workflow in `.github/workflows/test.yml`
