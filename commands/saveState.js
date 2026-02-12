const fs = require('fs');
const path = require('path');

const STATES_DIR = path.join(__dirname, '..', 'states');

async function saveState(page, args, context) {
  const name = args[0];
  if (!name) {
    return {
      status: 'error',
      action: 'saveState',
      message: 'State name is required. Usage: saveState <name>',
    };
  }

  if (!fs.existsSync(STATES_DIR)) {
    fs.mkdirSync(STATES_DIR, { recursive: true });
  }

  const storageState = await context.storageState();
  storageState.url = page.url();

  // Manually capture localStorage (storageState() may miss some origins like file://)
  try {
    const lsData = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
      }
      return data;
    });
    storageState.localStorage = lsData;
  } catch (e) {
    storageState.localStorage = {};
  }

  // Manually capture sessionStorage
  try {
    const ssData = await page.evaluate(() => {
      const data = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        data[key] = sessionStorage.getItem(key);
      }
      return data;
    });
    storageState.sessionStorage = ssData;
  } catch (e) {
    storageState.sessionStorage = {};
  }

  const filePath = path.join(STATES_DIR, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(storageState, null, 2));

  return { status: 'success', action: 'saveState', name, path: filePath };
}

module.exports = saveState;
