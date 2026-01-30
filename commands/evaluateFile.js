const fs = require('fs');

async function evaluateFile(page, args) {
  const scriptContent = fs.readFileSync(args[0], 'utf8');
  const fileEvalResult = await page.evaluate(scriptContent);
  return { status: 'success', data: fileEvalResult };
}

module.exports = evaluateFile;
