# LLM-Web-Pilot: Human-LLM Collaboration Interface for Web Browsers

LLM-Web-Pilot is a browser automation tool specifically designed for efficient interaction between humans and Large Language Models (LLMs). The primary goal is to provide a simple CLI interface that allows both humans and LLMs to easily control a web browser for various tasks: E2E testing, UI verification, routine automation, and other web interaction tasks.

---

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** (usually comes with Node.js)
- **Supported Browsers** (Chromium, Firefox, WebKit) – installed automatically via Playwright

---

## Installation

1. Ensure you have Node.js and npm installed:

   ```bash
   node --version
   npm --version
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Install Playwright browser binaries:
   ```bash
   npx playwright install
   ```

---

## Usage

All tests and interactions are executed through **self-contained scripts** that manage the browser and server lifecycle.

### Reference Test (`examples/test-reference.sh`)

A quick check to verify all core agent functions.

- **Command:** `bash examples/test-reference.sh`
- **Verifies:** clicks, text input, `localStorage`, attributes, and checkboxes on a local test page.

---

## Key Features

- **LLM-Oriented Interface:** Simple commands understandable by both humans and LLMs, with uniform JSON responses.
- **CI/CD Ready:** Works out-of-the-box with GitHub Actions.
- **Stability:** Guaranteed process cleanup (PIDs) after execution.
- **Diagnostics:** Automatic screenshots and DOM dumps on failure.
- **Human-Readable Errors:** Provides clear messages and diagnostic artifacts when things go wrong.

---

## Agent Commands (`web-pilot.js`)

The agent accepts a chain of commands separated by `;`. It returns an array of results for each step.

### Navigation & Interaction

- **goto** `url` – Navigates to a URL (waits for `domcontentloaded`).
- **click** `selector` – Clicks on an element.
- **type** `selector text` – Inputs text into a field.
- **waitElement** `selector` – Waits for element visibility (10s timeout).

### Data Retrieval

- **text** `selector` – Gets `innerText` (defaults to `body`).
- **getAttribute** `selector attr` – Gets the value of a specific element attribute.
- **isChecked** `selector` – Checks the state of a Checkbox/Radio button.

### Storage

- **localStorage** `clear` | `set k v` | `key` – Interact with Local Storage.
- **sessionStorage** `clear` | `set k v` | `key` – Interact with Session Storage.

### Network & Security

- **cookies** `clear` | `set name value` | `name` | `-` – Manage cookies (clear, set, get, or get all).
- **route** `intercept pattern response` | `continue pattern` – Intercept and mock network requests.
- **setOffline** `true/false` – Emulate network status.
- **security** `headers` | `mixedContent` | `report` – Security checks (headers, mixed content, full report).

### Performance & Media

- **performance** `metrics` | `timing` – Retrieve performance metrics (Core Web Vitals, Navigation Timing).
- **screenshot** `path` | `element selector path` | `fullpage path` – Take a manual, element-specific, or full-page screenshot.

### Files & Devices

- **file** `upload selector path` | `download path` – Upload/Download files.
- **mobile** `emulate device` | `setViewport width height` | `getUserAgent` – Mobile emulation (viewport, User Agent).

### Advanced APIs

- **worker** `start [name]` | `postMessage name message` | `terminate name` – Web Workers management.
- **serviceworker** `register path` | `status` | `unregister` – Service Worker management.
- **indexeddb** `create name [version]` | `add dbname storename data` | `get dbname storename [key]` | `delete name` – IndexedDB management.
- **waitServiceWorker** – Wait for Service Worker activation.

### Customization & Shutdown

- **custom** `run command [params]` | `define name code` – Define and run custom commands/plugins.
- **close** – Shuts down the browser server.

---

## Error Diagnostics

If any command in a chain fails, the agent:

1. Stops execution immediately.
2. Captures a screenshot: `agent_error.png`.
3. Dumps the full HTML source: `agent_error.html`.
4. Returns a JSON object with the error description and paths to artifacts.

---

## JSON Response Format

The agent always outputs results in a unified JSON format, optimized for LLM processing and human review:

```json
{
  "results": [
    { "status": "success", "action": "goto", "url": "..." },
    { "status": "success", "action": "click", "selector": "#btn" }
  ],
  "pageErrors": []
}
```

If `pageErrors` contains entries, it indicates that browser console exceptions occurred during execution. This allows LLMs to analyze the execution environment and adjust their actions accordingly.
