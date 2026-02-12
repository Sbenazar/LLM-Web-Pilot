const fs = require('fs');
const path = require('path');

const STATES_DIR = path.join(__dirname, '..', 'states');

async function restoreState(page, args, context, browser) {
  const name = args[0];
  if (!name) {
    return { status: 'error', action: 'restoreState', message: 'State name is required. Usage: restoreState <name>' };
  }

  const filePath = path.join(STATES_DIR, `${name}.json`);
  if (!fs.existsSync(filePath)) {
    return { status: 'error', action: 'restoreState', message: `State file not found: ${filePath}` };
  }

  const stateData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const savedUrl = stateData.url;
  const savedLocalStorage = stateData.localStorage || {};
  const savedSessionStorage = stateData.sessionStorage || {};

  // Remove custom fields before passing to Playwright
  delete stateData.url;
  delete stateData.localStorage;
  delete stateData.sessionStorage;

  const newContext = await browser.newContext({ storageState: stateData });
  const newPage = await newContext.newPage();

  if (savedUrl && savedUrl !== 'about:blank') {
    await newPage.goto(savedUrl);
    await newPage.waitForLoadState('domcontentloaded');
  }

  // Manually restore localStorage
  if (Object.keys(savedLocalStorage).length > 0) {
    try {
      await newPage.evaluate((data) => {
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(key, value);
        }
      }, savedLocalStorage);
    } catch (e) {
      // Ignore errors (e.g. about:blank)
    }
  }

  // Manually restore sessionStorage
  if (Object.keys(savedSessionStorage).length > 0) {
    try {
      await newPage.evaluate((data) => {
        for (const [key, value] of Object.entries(data)) {
          sessionStorage.setItem(key, value);
        }
      }, savedSessionStorage);
    } catch (e) {
      // Ignore errors
    }
  }

  try {
    await context.close();
  } catch (e) {
    // Old context may already be closed
  }

  return {
    status: 'success',
    action: 'restoreState',
    name,
    url: savedUrl,
    __newPage: newPage,
    __newContext: newContext,
  };
}

module.exports = restoreState;
