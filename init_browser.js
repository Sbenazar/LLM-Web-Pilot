const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SESSION_FILE = path.join(__dirname, 'session.json');

(async () => {
  try {
    const headless = process.env.HEADLESS === 'true';
    console.log(`Launching browser server (headless: ${headless})...`);
    const browserServer = await chromium.launchServer({ headless });
    const wsEndpoint = browserServer.wsEndpoint();
    const pid = browserServer.process().pid;

    fs.writeFileSync(SESSION_FILE, JSON.stringify({ wsEndpoint, pid }));

    console.log(`Browser server started with PID: ${pid}. Session saved.`);
    console.log(`To close, run: "kill ${pid}" or use the "close" command.`);

    // The active browserServer object should keep the process alive.
  } catch (error) {
    console.error(`Failed to launch browser server: ${error.message}`);
    process.exit(1);
  }
})();
