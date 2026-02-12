const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const commands = require('./commands');

const SESSION_FILE = path.join(__dirname, 'session.json');

// --- Matching ---

function partialMatch(actual, expected) {
  if (expected === null || expected === undefined) return true;
  if (typeof expected !== 'object') return actual === expected;
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false;
    for (let i = 0; i < expected.length; i++) {
      if (!partialMatch(actual[i], expected[i])) return false;
    }
    return true;
  }
  // Operators
  if ('$contains' in expected) {
    return typeof actual === 'string' && actual.includes(expected.$contains);
  }
  if ('$regex' in expected) {
    return (
      typeof actual === 'string' && new RegExp(expected.$regex, expected.$flags || '').test(actual)
    );
  }
  // Regular object matching
  if (typeof actual !== 'object' || actual === null) return false;
  for (const key of Object.keys(expected)) {
    if (!partialMatch(actual[key], expected[key])) return false;
  }
  return true;
}

// --- CLI args ---

function parseArgs(argv) {
  const args = argv.slice(2);
  let testFilePath = null;
  let tag = null;
  let format = 'json';
  const vars = {};

  for (const arg of args) {
    if (arg.startsWith('--tag=')) {
      tag = arg.slice(6);
    } else if (arg.startsWith('--var=')) {
      const pair = arg.slice(6);
      const eqIdx = pair.indexOf('=');
      if (eqIdx > 0) {
        vars[pair.slice(0, eqIdx)] = pair.slice(eqIdx + 1);
      }
    } else if (arg.startsWith('--format=')) {
      format = arg.slice(9);
    } else if (!arg.startsWith('--')) {
      testFilePath = arg;
    }
  }

  return { testFilePath, tag, format, vars };
}

function applyVars(str, vars) {
  if (!str || Object.keys(vars).length === 0) return str;
  let result = str;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`$${key}`, value);
  }
  return result;
}

// --- Command execution (shared with web-pilot.js) ---

async function executeCommandChain(commandString, page, context, browser, sessionData) {
  const commandChain = commandString
    .split(';')
    .map((cmd) => cmd.trim())
    .filter(Boolean);
  const results = [];
  const pageErrors = [];

  const errorListener = (exception) => {
    pageErrors.push(exception.message);
  };
  page.on('pageerror', errorListener);

  for (const command of commandChain) {
    const [cmd, ...args] = command.split(' ');
    let result;

    if (commands[cmd]) {
      const commandFn = commands[cmd];
      if (['close'].includes(cmd)) {
        result = await commandFn(page, args, { sessionData, SESSION_FILE });
      } else if (['evaluate', 'route', 'custom'].includes(cmd)) {
        result = await commandFn(page, args, context, command);
      } else if (['setOffline', 'cookies', 'saveState'].includes(cmd)) {
        result = await commandFn(page, args, context);
      } else if (['restoreState'].includes(cmd)) {
        result = await commandFn(page, args, context, browser);
        if (result.status === 'success') {
          page.off('pageerror', errorListener);
          page = result.__newPage;
          context = result.__newContext;
          page.on('pageerror', errorListener);
          delete result.__newPage;
          delete result.__newContext;
        }
      } else {
        result = await commandFn(page, args);
      }
    } else {
      result = { status: 'error', message: `Unknown command: ${cmd}` };
    }
    results.push(result);
    if (result.status === 'error') break;
  }

  page.off('pageerror', errorListener);
  return { results, pageErrors, page, context };
}

// --- Pretty output ---

function printPretty(report) {
  const green = '\x1b[32m';
  const red = '\x1b[31m';
  const dim = '\x1b[2m';
  const reset = '\x1b[0m';

  for (const r of report.results) {
    if (r.status === 'passed') {
      console.log(`${green}  PASSED${reset}  ${r.name}`);
    } else {
      console.log(`${red}  FAILED${reset}  ${r.name}`);
      if (r.error) {
        console.log(`${dim}          Error: ${r.error}${reset}`);
      }
      if (r.actual) {
        const last = r.actual.results[r.actual.results.length - 1];
        if (last && last.data) {
          const preview = String(last.data).slice(0, 200);
          console.log(`${dim}          Output: ${preview}${reset}`);
        }
        if (last && last.message) {
          console.log(`${dim}          Message: ${last.message}${reset}`);
        }
      }
    }
  }

  console.log('');
  console.log(
    `  Total: ${report.total}  Passed: ${green}${report.passed}${reset}  Failed: ${report.failed > 0 ? red : ''}${report.failed}${report.failed > 0 ? reset : ''}`
  );
}

// --- Main ---

async function runBatch({ testFilePath, tag, format, vars }) {
  if (!fs.existsSync(SESSION_FILE)) {
    const msg = 'Browser not initialized. Run "node init_browser.js" first.';
    if (format === 'pretty') {
      console.error(msg);
    } else {
      console.log(JSON.stringify({ status: 'error', message: msg }));
    }
    process.exit(1);
  }

  if (!testFilePath) {
    const msg =
      'No test file provided. Usage: node batch-runner.js <tests.json> [--tag=TAG] [--var=KEY=VALUE] [--format=json|pretty]';
    if (format === 'pretty') {
      console.error(msg);
    } else {
      console.log(JSON.stringify({ status: 'error', message: msg }));
    }
    process.exit(1);
  }

  const resolvedPath = path.resolve(testFilePath);
  if (!fs.existsSync(resolvedPath)) {
    const msg = `Test file not found: ${resolvedPath}`;
    if (format === 'pretty') {
      console.error(msg);
    } else {
      console.log(JSON.stringify({ status: 'error', message: msg }));
    }
    process.exit(1);
  }

  const testSuite = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  let { setup, teardown, tests } = testSuite;

  if (!tests || !Array.isArray(tests) || tests.length === 0) {
    const msg = 'Test file must contain a non-empty "tests" array.';
    if (format === 'pretty') {
      console.error(msg);
    } else {
      console.log(JSON.stringify({ status: 'error', message: msg }));
    }
    process.exit(1);
  }

  // Variable substitution
  if (Object.keys(vars).length > 0) {
    setup = applyVars(setup, vars);
    teardown = applyVars(teardown, vars);
    tests = tests.map((t) => ({ ...t, commands: applyVars(t.commands, vars) }));
  }

  // Tag filter
  if (tag) {
    tests = tests.filter((t) => t.tags && t.tags.includes(tag));
    if (tests.length === 0) {
      const report = { total: 0, passed: 0, failed: 0, results: [] };
      if (format === 'pretty') {
        console.log(`No tests found with tag: ${tag}`);
      } else {
        console.log(JSON.stringify(report));
      }
      process.exit(0);
    }
  }

  const sessionData = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
  let browser;

  try {
    browser = await chromium.connect(sessionData.wsEndpoint, { timeout: 10000 });
    let context = browser.contexts()[0] || (await browser.newContext());
    let page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

    const report = { total: tests.length, passed: 0, failed: 0, results: [] };

    for (const test of tests) {
      const testResult = { name: test.name, status: 'passed' };

      try {
        // Setup
        if (setup) {
          const setupOut = await executeCommandChain(setup, page, context, browser, sessionData);
          page = setupOut.page;
          context = setupOut.context;
        }

        // Execute test commands
        const testOut = await executeCommandChain(
          test.commands,
          page,
          context,
          browser,
          sessionData
        );
        page = testOut.page;
        context = testOut.context;
        const actual = { results: testOut.results, pageErrors: testOut.pageErrors };

        // Compare with expected
        if (test.expect) {
          if (!partialMatch(actual, test.expect)) {
            testResult.status = 'failed';
            testResult.expected = test.expect;
            testResult.actual = actual;
          }
        }

        // Teardown
        if (teardown) {
          const teardownOut = await executeCommandChain(
            teardown,
            page,
            context,
            browser,
            sessionData
          );
          page = teardownOut.page;
          context = teardownOut.context;
        }
      } catch (err) {
        testResult.status = 'failed';
        testResult.error = err.message;
      }

      if (testResult.status === 'passed') {
        report.passed++;
      } else {
        report.failed++;
      }
      report.results.push(testResult);
    }

    if (format === 'pretty') {
      printPretty(report);
    } else {
      console.log(JSON.stringify(report));
    }
    process.exit(report.failed > 0 ? 1 : 0);
  } catch (error) {
    if (format === 'pretty') {
      console.error(`Fatal: ${error.message}`);
    } else {
      console.log(JSON.stringify({ status: 'error', message: error.message }));
    }
    process.exit(1);
  }
}

const parsed = parseArgs(process.argv);
runBatch(parsed);
