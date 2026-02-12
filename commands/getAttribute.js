async function getAttribute(page, args) {
  if (!args[0] || !args[1]) {
    return { status: 'error', action: 'getAttribute', message: 'Usage: getAttribute <selector> <attribute>' };
  }
  try {
    const attrVal = await page.getAttribute(args[0], args[1]);
    return {
      status: 'success',
      action: 'getAttribute',
      selector: args[0],
      attribute: args[1],
      value: attrVal,
    };
  } catch (error) {
    return { status: 'error', action: 'getAttribute', message: error.message };
  }
}

module.exports = getAttribute;
