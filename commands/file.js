const fs = require('fs');
const path = require('path');

async function fileCmd(page, args) {
  if (args[0] === 'upload') {
    const selector = args[1];
    const filePath = args[2];

    if (!selector || !filePath) {
      return {
        status: 'error',
        action: 'file',
        operation: 'upload',
        message: 'Selector and file path are required for upload operation',
      };
    }

    try {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.click(selector),
      ]);
      await fileChooser.setFiles(filePath);

      return {
        status: 'success',
        action: 'file',
        operation: 'upload',
        selector: selector,
        filePath: filePath,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'file',
        operation: 'upload',
        message: error.message,
      };
    }
  } else if (args[0] === 'download') {
    const downloadPath = args[1];

    if (!downloadPath) {
      return {
        status: 'error',
        action: 'file',
        operation: 'download',
        message: 'Download path is required for download operation',
      };
    }

    try {
      let finalPath;
      if (
        downloadPath.startsWith('./tmp/') ||
        downloadPath.startsWith('/tmp/') ||
        downloadPath.includes('tmp/')
      ) {
        finalPath = downloadPath;
      } else {
        const tmpDir = path.join(__dirname, 'tmp');
        if (!fs.existsSync(tmpDir)) {
          fs.mkdirSync(tmpDir, { recursive: true });
        }
        finalPath = path.join(tmpDir, path.basename(downloadPath));
      }

      const download = await page.waitForEvent('download');

      await download.saveAs(finalPath);

      return {
        status: 'success',
        action: 'file',
        operation: 'download',
        downloadPath: finalPath,
        suggestedFilename: download.suggestedFilename(),
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'file',
        operation: 'download',
        message: error.message,
      };
    }
  } else {
    return {
      status: 'error',
      message: 'Invalid file operation. Use: file upload <selector> <path> or file download <path>',
    };
  }
}

module.exports = fileCmd;
