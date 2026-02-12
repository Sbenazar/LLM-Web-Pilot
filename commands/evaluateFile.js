const fs = require('fs');
const path = require('path');

async function evaluateFile(page, args) {
  try {
    if (!args[0]) {
      return {
        status: 'error',
        action: 'evaluateFile',
        message: 'Usage: evaluateFile <path>',
      };
    }

    const filePath = args[0];
    const resolvedPath = path.resolve(filePath);
    const projectRoot = path.resolve(__dirname, '..');

    if (!resolvedPath.startsWith(projectRoot)) {
      return {
        status: 'error',
        action: 'evaluateFile',
        message: 'Path must be within the project directory',
      };
    }

    if (!fs.existsSync(resolvedPath)) {
      return {
        status: 'error',
        action: 'evaluateFile',
        message: `File not found: ${filePath}`,
      };
    }

    const scriptContent = fs.readFileSync(resolvedPath, 'utf8');
    const fileEvalResult = await page.evaluate(scriptContent);
    return { status: 'success', action: 'evaluateFile', data: fileEvalResult };
  } catch (error) {
    return {
      status: 'error',
      action: 'evaluateFile',
      message: error.message,
    };
  }
}

module.exports = evaluateFile;
