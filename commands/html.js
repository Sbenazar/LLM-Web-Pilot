async function html(page) {
  try {
    const htmlContent = await page.content();
    return { status: 'success', action: 'html', data: htmlContent };
  } catch (error) {
    return { status: 'error', action: 'html', message: error.message };
  }
}

module.exports = html;
