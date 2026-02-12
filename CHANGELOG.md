# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-12

### Added
- **saveState** command — saves browser state (cookies, localStorage, URL) to `states/<name>.json`.
- **restoreState** command — restores browser state from a saved file, creating a new browser context.
- **Batch Test Runner** (`batch-runner.js`) — runs multiple tests from a JSON file with shared `setup`/`teardown`, partial-match `expect`, and a summary JSON report.
- Test scripts: `examples/test-state.sh`, `examples/test-batch.sh`.
- Example batch test file: `examples/batch-example.json`.

## [1.0.0] - 2026-01-30

### Added

- Initial release of LLM-Web-Pilot.
- Comprehensive CLI interface for browser automation.
- Support for 25+ commands including navigation, interaction, storage, and network interception.
- Automated error diagnostics (screenshots, HTML dumps).
- Unified JSON response format for LLM integration.
- Reference example and 10+ test scenarios.
- Support for Playwright (Chromium, Firefox, WebKit).
- Human-LLM collaboration features.
