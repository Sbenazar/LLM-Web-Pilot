async function wait(page, args) {
  const waitTime = parseInt(args[0], 10);
  if (isNaN(waitTime)) {
    return {
      status: 'error',
      message: 'Invalid wait time. Use: wait <milliseconds>',
    };
  }
  await page.waitForTimeout(waitTime);
  return { status: 'success', action: 'wait', duration: waitTime };
}

module.exports = wait;
