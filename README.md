# Check pnpm Overrides GitHub Action

[![MIT license](https://img.shields.io/github/license/mfranzke/check-pnpm-overrides "license MIT badge")](https://opensource.org/licenses/mit-license.php)
[![Default CI/CD Pipeline](https://github.com/mfranzke/check-pnpm-overrides/actions/workflows/test.yml/badge.svg)](https://github.com/mfranzke/check-pnpm-overrides/actions/workflows/default.yml)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Open Source Love](https://badges.frapsoft.com/os/v3/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badges/)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.0-4baaaa.svg)](CODE-OF-CONDUCT.md)

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

```yaml
name: Check pnpm Overrides

on:
    workflow_dispatch: # manual run
    schedule:
        - cron: "0 3 * * 0" # weekly

permissions:
    contents: write # Required to commit changes and create branches
    pull-requests: write # Required to create pull requests

jobs:
    check-overrides:
        runs-on: ubuntu-latest
        steps:
            - name: Checkout repository
              uses: actions/checkout@v4
              with:
                  fetch-depth: 0 # needed for PR creation

            - name: Install pnpm
              uses: pnpm/action-setup@v4

            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version-file: ".nvmrc"
                  cache: "pnpm"

            - uses: mfranzke/check-pnpm-overrides@v0.0
```

## Permissions

This action requires the following permissions to function properly:

- `contents: write` - To create commits and branches
- `pull-requests: write` - To create pull requests

If you encounter the error "GitHub Actions is not permitted to create or approve pull requests", ensure your workflow has the correct permissions as shown in the usage example above.

## Troubleshooting

### "GitHub Actions is not permitted to create or approve pull requests"

This error occurs when the workflow doesn't have the necessary permissions. Add the following to your workflow file:

```yaml
permissions:
    contents: write
    pull-requests: write
```

### Actions Settings

Additionally check for the repositories settings within actions / general (`/settings/actions`):
The setting "Allow GitHub Actions to create and approve pull requests" must be activated.
