async function setOffline(page, args, context) {
  if (!args[0]) {
    return { status: 'error', action: 'setOffline', message: 'Usage: setOffline <true|false>' };
  }
  try {
    const offline = args[0] === 'true';
    await context.setOffline(offline);
    return { status: 'success', action: 'setOffline', offline };
  } catch (error) {
    return { status: 'error', action: 'setOffline', message: error.message };
  }
}

module.exports = setOffline;
