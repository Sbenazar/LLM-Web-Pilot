async function isChecked(page, args) {
  const checked = await page.isChecked(args[0]);
  return { status: 'success', action: 'isChecked', selector: args[0], value: checked };
}

module.exports = isChecked;
