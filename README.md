# Check pnpm Overrides GitHub Action

This GitHub Action helps you determine if your `pnpm` overrides in `package.json` are still necessary.
It works by temporarily removing the `overrides` section, reinstalling dependencies, and running `pnpm audit`.

## Why?

Sometimes, `pnpm audit --fix` adds overrides to `package.json` to patch vulnerabilities.
Over time, these fixes may become unnecessary as upstream dependencies patch the issues.
This action helps you check without manually editing files.

## Features

- Runs on demand or on a schedule
- Works in CI without changing your repo
- Outputs audit results for comparison

## Usage

### Manual Run

```yaml
name: Check pnpm Overrides
on:
  workflow_dispatch:

jobs:
  check-overrides:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # needed for PR creation

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: "pnpm"

      - uses: mfranzke/check-pnpm-overrides@v1
