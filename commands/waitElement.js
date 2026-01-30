async function waitElement(page, args) {
  const elementSelector = args.join(' ');
  try {
    await page.waitForSelector(elementSelector, {
      state: 'visible',
      timeout: 10000,
    });
    return {
      status: 'success',
      action: 'waitElement',
      selector: elementSelector,
    };
  } catch (e) {
    return {
      status: 'error',
      message: `Element not found within timeout: ${elementSelector}`,
      action: 'waitElement',
      selector: elementSelector,
    };
  }
}

module.exports = waitElement;
