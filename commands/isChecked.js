async function isChecked(page, args) {
  if (!args[0]) {
    return { status: 'error', action: 'isChecked', message: 'Usage: isChecked <selector>' };
  }
  try {
    const checked = await page.isChecked(args[0]);
    return { status: 'success', action: 'isChecked', selector: args[0], value: checked };
  } catch (error) {
    return { status: 'error', action: 'isChecked', message: error.message };
  }
}

module.exports = isChecked;
