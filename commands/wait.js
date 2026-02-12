async function wait(page, args) {
  if (!args[0]) {
    return { status: 'error', action: 'wait', message: 'Usage: wait <milliseconds>' };
  }
  const waitTime = parseInt(args[0], 10);
  if (isNaN(waitTime)) {
    return { status: 'error', action: 'wait', message: 'Usage: wait <milliseconds>' };
  }
  try {
    await page.waitForTimeout(waitTime);
    return { status: 'success', action: 'wait', duration: waitTime };
  } catch (error) {
    return { status: 'error', action: 'wait', message: error.message };
  }
}

module.exports = wait;
