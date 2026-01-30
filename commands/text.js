async function text(page, args) {
  const textContent = await page.locator(args.join(' ') || 'body').innerText();
  return { status: 'success', action: 'text', data: textContent };
}

module.exports = text;
