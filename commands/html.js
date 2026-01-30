async function html(page) {
  const htmlContent = await page.content();
  return { status: 'success', action: 'html', data: htmlContent };
}

module.exports = html;
