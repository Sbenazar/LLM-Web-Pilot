async function waitServiceWorker(page) {
  try {
    await page.waitForFunction(
      () => {
        return (
          typeof navigator.serviceWorker !== 'undefined' &&
          navigator.serviceWorker.controller !== null
        );
      },
      { timeout: 10000 }
    );
    return { status: 'success', action: 'waitServiceWorker' };
  } catch (e) {
    return {
      status: 'error',
      message: 'Service worker did not become active within timeout',
      action: 'waitServiceWorker',
    };
  }
}

module.exports = waitServiceWorker;
