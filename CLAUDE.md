# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LLM-Web-Pilot is a CLI-based browser automation tool built on Playwright, designed for LLM-human collaboration. It provides a command-driven interface that outputs structured JSON, making it suitable for E2E testing, UI verification, and browser automation tasks orchestrated by LLMs.

## Commands

```bash
# Install dependencies
npm install

# Install Playwright browsers (required first time)
npx playwright install --with-deps

# Start browser server (must run before executing commands)
node init_browser.js              # headed mode
HEADLESS=true node init_browser.js # headless mode

# Execute browser commands (server must be running)
node web-pilot.js "goto https://example.com"
node web-pilot.js "goto https://example.com; click #btn; text #result"

# Run the reference test suite
npm test                          # or: bash examples/test-reference.sh

# Run a specific test scenario
bash examples/test-advanced.sh
bash examples/test-worker.sh
# (see examples/ directory for all test scripts)
```

## Architecture

### Two-process model

1. **Browser server** (`init_browser.js`) — launches a Playwright Chromium server, writes its WebSocket endpoint and PID to `session.json`, and stays alive as a background process.
2. **Command executor** (`web-pilot.js`) — reads `session.json`, connects to the running browser via WebSocket, executes a semicolon-separated command chain, prints a single JSON result to stdout, then exits.

### Command system

All 29 commands live in `commands/` as individual modules exporting an async function. They are registered in `commands/index.js`. The command name in the CLI maps directly to the export key in that registry.

**Command function signatures vary** depending on what context the command needs — this is dispatched in `web-pilot.js`:
- Default: `(page, args)`
- Context-aware (`setOffline`, `cookies`, `saveState`): `(page, args, context)`
- Full command string (`evaluate`, `route`, `custom`): `(page, args, context, command)`
- Session-aware (`close`): `(page, args, { sessionData, SESSION_FILE })`
- Browser-aware (`restoreState`): `(page, args, context, browser)` — returns `__newPage`/`__newContext` to replace the active page/context

When adding a new command: create the module in `commands/`, add it to `commands/index.js`, and if it needs a non-default signature, add it to the appropriate `if` branch in `web-pilot.js`.

### Output contract

Every command returns `{ status: 'success'|'error', action: '...', ...data }`. The executor wraps all results into `{ results: [...], pageErrors: [...] }`. On unhandled errors, a screenshot and HTML dump are saved to `tmp/`.

### Batch test runner

`batch-runner.js` is a separate entry point that runs tests from a JSON file. Each test specifies a command chain and an optional `expect` block for partial matching. Shared `setup`/`teardown` command chains run before/after each test. Output is a JSON report with `total`/`passed`/`failed` counts. See `examples/batch-example.json`.

### State management

`saveState <name>` saves cookies, localStorage, and the current URL to `states/<name>.json`. `restoreState <name>` creates a new browser context from the saved state and navigates to the saved URL. This is useful for skipping repetitive auth flows in large test suites.

### Error handling

Command chains stop on first error (`web-pilot.js:69`). On crash, diagnostics are saved to `tmp/agent_error.png` and `tmp/agent_error.html`.

## Testing

Tests are bash scripts in `examples/` — not a JS test framework. Each script:
1. Starts a headless browser server
2. Runs command chains against `test_page.html`
3. Validates JSON output with `grep`
4. Cleans up via `trap cleanup EXIT`

CI runs `examples/test-reference.sh` on ubuntu-latest with Node 20 (`.github/workflows/e2e.yml`).

## Tech Stack

- Pure JavaScript (no TypeScript, no build step)
- Node.js 18+
- Playwright (sole dependency)
- No linter or formatter configured
