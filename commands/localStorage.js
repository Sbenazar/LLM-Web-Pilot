async function localStorageCmd(page, args) {
  try {
    if (args[0] === 'clear') {
      await page.evaluate(() => localStorage.clear());
      return { status: 'success', action: 'localStorage', operation: 'clear' };
    } else if (args[0] === 'set') {
      if (!args[1]) {
        return {
          status: 'error',
          action: 'localStorage',
          message: 'Usage: localStorage set <key> <value>',
        };
      }
      await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
        key: args[1],
        value: args.slice(2).join(' '),
      });
      return { status: 'success', action: 'localStorage', operation: 'set', key: args[1] };
    } else {
      if (!args[0]) {
        return {
          status: 'error',
          action: 'localStorage',
          message:
            'Usage: localStorage <key> | localStorage set <key> <value> | localStorage clear',
        };
      }
      const lsValue = await page.evaluate((key) => localStorage.getItem(key), args[0]);
      return {
        status: 'success',
        action: 'localStorage',
        operation: 'get',
        key: args[0],
        value: lsValue,
      };
    }
  } catch (error) {
    return {
      status: 'error',
      action: 'localStorage',
      message: error.message,
    };
  }
}

module.exports = localStorageCmd;
