async function mobile(page, args) {
  if (args[0] === 'emulate') {
    const deviceName = args[1];

    if (!deviceName) {
      return {
        status: 'error',
        action: 'mobile',
        operation: 'emulate',
        message: 'Device name is required for emulate operation',
      };
    }

    try {
      const devicePresets = {
        'iPhone 11': {
          viewport: { width: 414, height: 896 },
          userAgent:
            'Mozilla/5.0 (iPhone; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1',
          deviceScaleFactor: 2,
          isMobile: true,
          hasTouch: true,
          defaultBrowserType: 'webkit',
        },
        'Pixel 5': {
          viewport: { width: 393, height: 851 },
          userAgent:
            'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.58 Mobile Safari/537.36',
          deviceScaleFactor: 3,
          isMobile: true,
          hasTouch: true,
          defaultBrowserType: 'chromium',
        },
      };

      const device = devicePresets[deviceName];

      if (!device) {
        return {
          status: 'error',
          action: 'mobile',
          operation: 'emulate',
          message: `Device preset "${deviceName}" not found. Available presets: ${Object.keys(devicePresets).join(', ')}`,
        };
      }

      await page.setViewportSize(device.viewport);

      return {
        status: 'success',
        action: 'mobile',
        operation: 'emulate',
        device: deviceName,
        data: device,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'mobile',
        operation: 'emulate',
        message: error.message,
      };
    }
  } else if (args[0] === 'setViewport') {
    const width = parseInt(args[1]);
    const height = parseInt(args[2]);

    if (isNaN(width) || isNaN(height)) {
      return {
        status: 'error',
        action: 'mobile',
        operation: 'setViewport',
        message: 'Width and height must be valid numbers',
      };
    }

    try {
      await page.setViewportSize({ width, height });

      return {
        status: 'success',
        action: 'mobile',
        operation: 'setViewport',
        width: width,
        height: height,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'mobile',
        operation: 'setViewport',
        message: error.message,
      };
    }
  } else if (args[0] === 'getUserAgent') {
    try {
      const userAgent = await page.evaluate(() => navigator.userAgent);

      return {
        status: 'success',
        action: 'mobile',
        operation: 'getUserAgent',
        userAgent: userAgent,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'mobile',
        operation: 'getUserAgent',
        message: error.message,
      };
    }
  } else {
    return {
      status: 'error',
      message:
        'Invalid mobile operation. Use: mobile emulate <device>, mobile setViewport <width> <height>, or mobile getUserAgent',
    };
  }
}

module.exports = mobile;
