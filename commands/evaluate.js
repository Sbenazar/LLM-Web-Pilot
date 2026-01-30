async function evaluate(page, args, context, command) {
  const script = command.substring(command.indexOf(' ') + 1);
  const evalResult = await page.evaluate(script);
  return { status: 'success', data: evalResult };
}

module.exports = evaluate;
