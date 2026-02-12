async function goto(page, args) {
  if (!args[0]) {
    return { status: 'error', action: 'goto', message: 'Usage: goto <url>' };
  }
  try {
    await page.goto(args[0]);
    await page.waitForLoadState('domcontentloaded');
    return { status: 'success', action: 'goto', url: page.url() };
  } catch (error) {
    return { status: 'error', action: 'goto', message: error.message };
  }
}

module.exports = goto;
