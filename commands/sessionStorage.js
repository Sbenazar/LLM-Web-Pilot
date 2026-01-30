async function sessionStorageCmd(page, args) {
  if (args[0] === 'clear') {
    await page.evaluate(() => sessionStorage.clear());
    return { status: 'success', action: 'sessionStorage', operation: 'clear' };
  } else if (args[0] === 'set') {
    await page.evaluate(({ key, value }) => sessionStorage.setItem(key, value), {
      key: args[1],
      value: args.slice(2).join(' '),
    });
    return {
      status: 'success',
      action: 'sessionStorage',
      operation: 'set',
      key: args[1],
    };
  } else {
    const ssValue = await page.evaluate((key) => sessionStorage.getItem(key), args[0]);
    return {
      status: 'success',
      action: 'sessionStorage',
      operation: 'get',
      key: args[0],
      value: ssValue,
    };
  }
}

module.exports = sessionStorageCmd;
