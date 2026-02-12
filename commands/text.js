async function text(page, args) {
  try {
    const textContent = await page.locator(args.join(' ') || 'body').innerText();
    return { status: 'success', action: 'text', data: textContent };
  } catch (error) {
    return { status: 'error', action: 'text', message: error.message };
  }
}

module.exports = text;
