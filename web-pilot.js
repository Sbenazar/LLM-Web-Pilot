const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const commands = require('./commands');

const SESSION_FILE = path.join(__dirname, 'session.json');

async function runAgent(commandString) {
  if (!fs.existsSync(SESSION_FILE)) {
    console.log(
      JSON.stringify({
        status: 'error',
        message:
          'Browser not initialized. Run "node init_browser.js" first in a separate terminal.',
      })
    );
    process.exit(1);
  }

  if (!commandString) {
    console.log(
      JSON.stringify({
        status: 'error',
        message: 'No command string provided.',
      })
    );
    process.exit(1);
  }

  const sessionData = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
  let browser;
  try {
    browser = await chromium.connect(sessionData.wsEndpoint, { timeout: 10000 });
    const context = browser.contexts()[0] || (await browser.newContext());

    const pages = context.pages();
    let currentContext = context;
    let page = pages.length > 0 ? pages[0] : await context.newPage();
    await page.bringToFront();

    const pageErrors = [];
    page.on('pageerror', (exception) => {
      pageErrors.push(exception.message);
    });

    const commandChain = commandString.split(';').map((cmd) => cmd.trim());
    const results = [];

    for (const command of commandChain) {
      const [cmd, ...args] = command.split(' ');
      let result;

      if (commands[cmd]) {
        const commandFn = commands[cmd];
        // Some commands have a different signature or require additional context
        if (['close'].includes(cmd)) { // 'close' needs sessionData and SESSION_FILE
            result = await commandFn(page, args, { sessionData, SESSION_FILE });
        } else if (['evaluate', 'route', 'custom'].includes(cmd)) { // 'evaluate', 'route', 'custom' need the full command string
            result = await commandFn(page, args, currentContext, command);
        } else if (['setOffline', 'cookies', 'saveState'].includes(cmd)) { // 'setOffline', 'cookies', 'saveState' need the context object
            result = await commandFn(page, args, currentContext);
        } else if (['restoreState'].includes(cmd)) { // 'restoreState' needs browser to create new context
            result = await commandFn(page, args, currentContext, browser);
            if (result.status === 'success') {
              page = result.__newPage;
              currentContext = result.__newContext;
              page.on('pageerror', (exception) => {
                pageErrors.push(exception.message);
              });
              delete result.__newPage;
              delete result.__newContext;
            }
        }
        else { // Default for most commands
            result = await commandFn(page, args);
        }
      } else {
        result = { status: 'error', message: `Unknown command: ${cmd}` };
      }
      results.push(result);
      if (result.status === 'error') break;
    }

    console.log(JSON.stringify({ results, pageErrors }));
    process.exit(0);
  } catch (error) {
    if (browser) {
      try {
        const contexts = browser.contexts();
        if (contexts.length > 0 && contexts[0].pages().length > 0) {
          const errorPage = contexts[0].pages()[0];
          const tmpDir = path.join(__dirname, 'tmp');
          if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
          }
          await errorPage.screenshot({ path: path.join(tmpDir, 'agent_error.png') });
          const html = await errorPage.content();
          fs.writeFileSync(path.join(tmpDir, 'agent_error.html'), html);
        }
      } catch (screenshotError) {
        // Ignore screenshot errors
      }
    }
    console.log(
      JSON.stringify({
        status: 'error',
        message: error.message,
        screenshot: './tmp/agent_error.png',
        html_dump: './tmp/agent_error.html',
      })
    );
    process.exit(1);
  }
}

const [, , commandString] = process.argv;
runAgent(commandString);
