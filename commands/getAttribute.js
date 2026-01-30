async function getAttribute(page, args) {
  const attrVal = await page.getAttribute(args[0], args[1]);
  return {
    status: 'success',
    action: 'getAttribute',
    selector: args[0],
    attribute: args[1],
    value: attrVal,
  };
}

module.exports = getAttribute;
