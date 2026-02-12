async function route(page, args, context, command) {
  try {
    if (args[0] === 'intercept') {
      if (!args[1] || !args[2]) {
        return {
          status: 'error',
          action: 'route',
          message: 'Usage: route intercept <pattern> <response>',
        };
      }
      const pattern = args[1]; // URL pattern to intercept
      const mockResponse = args.slice(2).join(' '); // Response to return

      await page.route(pattern, (route) => {
        route
          .fulfill({
            status: 200,
            contentType: 'application/json',
            body: mockResponse,
          })
          .catch((error) => {
            console.error('Route fulfillment failed:', error);
          });
      });

      await page.evaluate(() => {
        window.__hasActiveRoutes = true;
      });

      return {
        status: 'success',
        action: 'route',
        operation: 'intercept',
        pattern: pattern,
      };
    } else if (args[0] === 'continue') {
      if (!args[1]) {
        return {
          status: 'error',
          action: 'route',
          message: 'Usage: route continue <pattern>',
        };
      }
      const pattern = args[1]; // URL pattern to stop intercepting

      await page.unroute(pattern);

      await page.evaluate(() => {
        window.__hasActiveRoutes = false;
      });

      return {
        status: 'success',
        action: 'route',
        operation: 'continue',
        pattern: pattern,
      };
    } else {
      return {
        status: 'error',
        action: 'route',
        message:
          'Invalid route operation. Use: route intercept <pattern> <response> or route continue <pattern>',
      };
    }
  } catch (error) {
    return {
      status: 'error',
      action: 'route',
      message: error.message,
    };
  }
}

module.exports = route;
