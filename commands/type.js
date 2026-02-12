async function type(page, args) {
  if (!args[0]) {
    return { status: 'error', action: 'type', message: 'Usage: type <selector> <text>' };
  }
  if (args.length < 2) {
    return { status: 'error', action: 'type', message: 'Usage: type <selector> <text>' };
  }
  try {
    await page.fill(args[0], args.slice(1).join(' '));
    return { status: 'success', action: 'type', selector: args[0] };
  } catch (error) {
    return { status: 'error', action: 'type', message: error.message };
  }
}

module.exports = type;
