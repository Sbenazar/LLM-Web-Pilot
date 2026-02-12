const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const commands = require('./commands');

const SESSION_FILE = path.join(__dirname, 'session.json');

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
  if (typeof actual !== 'object' || actual === null) return false;
  for (const key of Object.keys(expected)) {
    if (!partialMatch(actual[key], expected[key])) return false;
  }
  return true;
}

async function executeCommandChain(commandString, page, context, browser, sessionData) {
  const commandChain = commandString.split(';').map((cmd) => cmd.trim()).filter(Boolean);
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

  return { results, pageErrors, page, context };
}

async function runBatch(testFilePath) {
  if (!fs.existsSync(SESSION_FILE)) {
    console.log(JSON.stringify({
      status: 'error',
      message: 'Browser not initialized. Run "node init_browser.js" first.',
    }));
    process.exit(1);
  }

  if (!testFilePath) {
    console.log(JSON.stringify({
      status: 'error',
      message: 'No test file provided. Usage: node batch-runner.js <tests.json>',
    }));
    process.exit(1);
  }

  const resolvedPath = path.resolve(testFilePath);
  if (!fs.existsSync(resolvedPath)) {
    console.log(JSON.stringify({
      status: 'error',
      message: `Test file not found: ${resolvedPath}`,
    }));
    process.exit(1);
  }

  const testSuite = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  const { setup, teardown, tests } = testSuite;

  if (!tests || !Array.isArray(tests) || tests.length === 0) {
    console.log(JSON.stringify({
      status: 'error',
      message: 'Test file must contain a non-empty "tests" array.',
    }));
    process.exit(1);
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
        const testOut = await executeCommandChain(test.commands, page, context, browser, sessionData);
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
          const teardownOut = await executeCommandChain(teardown, page, context, browser, sessionData);
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

    console.log(JSON.stringify(report));
    process.exit(report.failed > 0 ? 1 : 0);
  } catch (error) {
    console.log(JSON.stringify({
      status: 'error',
      message: error.message,
    }));
    process.exit(1);
  }
}

const [, , testFilePath] = process.argv;
runBatch(testFilePath);
