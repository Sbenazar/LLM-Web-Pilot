async function serviceworker(page, args) {
  if (args[0] === 'register') {
    const swPath = args[1];

    if (!swPath) {
      return {
        status: 'error',
        action: 'serviceworker',
        operation: 'register',
        message: 'Service worker path is required for register operation',
      };
    }

    try {
      const registrationResult = await page.evaluate(async (swPath) => {
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register(swPath);
            return {
              success: true,
              scope: registration.scope,
              registration,
            };
          } catch (error) {
            return {
              success: false,
              error: error.message,
            };
          }
        } else {
          return {
            success: false,
            error: 'Service Worker API not supported',
          };
        }
      }, swPath);

      return {
        status: 'success',
        action: 'serviceworker',
        operation: 'register',
        data: registrationResult,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'serviceworker',
        operation: 'register',
        message: error.message,
      };
    }
  } else if (args[0] === 'status') {
    try {
      const status = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();

            if (registrations.length === 0) {
              return {
                registered: false,
                count: 0,
                workers: [],
              };
            }

            const workersInfo = [];
            for (const registration of registrations) {
              workersInfo.push({
                scope: registration.scope,
                active: registration.active
                  ? {
                      state: registration.active.state,
                      scriptURL: registration.active.scriptURL,
                    }
                  : null,
                installing: registration.installing
                  ? {
                      state: registration.installing.state,
                      scriptURL: registration.installing.scriptURL,
                    }
                  : null,
                waiting: registration.waiting
                  ? {
                      state: registration.waiting.state,
                      scriptURL: registration.waiting.scriptURL,
                    }
                  : null,
              });
            }

            return {
              registered: true,
              count: registrations.length,
              workers: workersInfo,
            };
          } catch (error) {
            return {
              error: error.message,
            };
          }
        } else {
          return {
            error: 'Service Worker API not supported',
          };
        }
      });

      return {
        status: 'success',
        action: 'serviceworker',
        operation: 'status',
        data: status,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'serviceworker',
        operation: 'status',
        message: error.message,
      };
    }
  } else if (args[0] === 'unregister') {
    try {
      const unregistrationResult = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            const unregistrationResults = [];

            for (const registration of registrations) {
              const success = await registration.unregister();
              unregistrationResults.push({
                scope: registration.scope,
                success: success,
              });
            }

            return {
              success: true,
              count: unregistrationResults.length,
              results: unregistrationResults,
            };
          } catch (error) {
            return {
              success: false,
              error: error.message,
            };
          }
        } else {
          return {
            success: false,
            error: 'Service Worker API not supported',
          };
        }
      });

      return {
        status: 'success',
        action: 'serviceworker',
        operation: 'unregister',
        data: unregistrationResult,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'serviceworker',
        operation: 'unregister',
        message: error.message,
      };
    }
  } else {
    return {
      status: 'error',
      message:
        'Invalid serviceworker operation. Use: serviceworker register <path>, serviceworker status, or serviceworker unregister',
    };
  }
}

module.exports = serviceworker;
