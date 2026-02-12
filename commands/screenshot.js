const fs = require('fs');
const path = require('path');

async function screenshot(page, args) {
  if (args[0] === 'element') {
    const selector = args[1];
    const outputPath = args[2];

    if (!outputPath) {
      return {
        status: 'error',
        action: 'screenshot',
        operation: 'element',
        message: 'Path is required for element screenshot',
      };
    }

    try {
      const element = page.locator(selector);
      await element.waitFor({ state: 'visible' });

      const pathLower = outputPath.toLowerCase();
      let format = undefined;
      if (pathLower.endsWith('.png')) {
        format = 'png';
      } else if (pathLower.endsWith('.jpeg') || pathLower.endsWith('.jpg')) {
        format = 'jpeg';
      } else if (pathLower.endsWith('.webp')) {
        format = 'webp';
      }

      await element.screenshot({
        path: outputPath,
        ...(format ? { type: format } : {}),
      });

      return {
        status: 'success',
        action: 'screenshot',
        operation: 'element',
        selector: selector,
        path: outputPath,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'screenshot',
        operation: 'element',
        message: error.message,
      };
    }
  } else if (args[0] === 'fullpage') {
    const outputPath = args[1];

    if (!outputPath) {
      return {
        status: 'error',
        action: 'screenshot',
        operation: 'fullpage',
        message: 'Path is required for fullpage screenshot',
      };
    }

    try {
      const pathLower = outputPath.toLowerCase();
      let format = undefined;
      if (pathLower.endsWith('.png')) {
        format = 'png';
      } else if (pathLower.endsWith('.jpeg') || pathLower.endsWith('.jpg')) {
        format = 'jpeg';
      } else if (pathLower.endsWith('.webp')) {
        format = 'webp';
      }

      await page.screenshot({
        path: outputPath,
        fullPage: true,
        ...(format ? { type: format } : {}),
      });

      return {
        status: 'success',
        action: 'screenshot',
        operation: 'fullpage',
        path: outputPath,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'screenshot',
        operation: 'fullpage',
        message: error.message,
      };
    }
  } else {
    const outputPath = args[0] || 'screenshot.png';

    try {
      const pathLower = outputPath.toLowerCase();
      let format = undefined;
      if (pathLower.endsWith('.png')) {
        format = 'png';
      } else if (pathLower.endsWith('.jpeg') || pathLower.endsWith('.jpg')) {
        format = 'jpeg';
      } else if (pathLower.endsWith('.webp')) {
        format = 'webp';
      }

      await page.screenshot({
        path: outputPath,
        ...(format ? { type: format } : {}),
      });

      return {
        status: 'success',
        action: 'screenshot',
        path: outputPath,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'screenshot',
        message: error.message,
      };
    }
  }
}

module.exports = screenshot;
