async function setOffline(page, args, context) {
  const offline = args[0] === 'true';
  await context.setOffline(offline);
  return { status: 'success', action: 'setOffline', offline };
}

module.exports = setOffline;
