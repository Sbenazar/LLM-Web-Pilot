const fs = require('fs');

async function close(page, args, { sessionData, SESSION_FILE }) {
  if (sessionData.pid) {
    try {
      process.kill(sessionData.pid);
    } catch (e) {
      // Ignore errors if process is already gone
    }
  }
  if (fs.existsSync(SESSION_FILE)) {
    fs.unlinkSync(SESSION_FILE);
  }
  return {
    status: 'success',
    action: 'close',
    message: `Browser server (PID: ${sessionData.pid}) closed and session deleted.`,
  };
}

module.exports = close;
