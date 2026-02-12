async function evaluate(page, args, context, command) {
  try {
    const script = command.substring(command.indexOf(' ') + 1);
    if (!script || script === command || script.trim() === '') {
      return {
        status: 'error',
        action: 'evaluate',
        message: 'Usage: evaluate <script>',
      };
    }
    const evalResult = await page.evaluate(script);
    return { status: 'success', action: 'evaluate', data: evalResult };
  } catch (error) {
    return {
      status: 'error',
      action: 'evaluate',
      message: error.message,
    };
  }
}

module.exports = evaluate;
