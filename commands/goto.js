async function goto(page, args) {
  await page.goto(args[0]);
  await page.waitForLoadState('domcontentloaded');
  return { status: 'success', action: 'goto', url: page.url() };
}

module.exports = goto;
