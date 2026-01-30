async function custom(page, args, context, command) {
  if (args[0] === 'run') {
    const commandName = args[1];
    const params = args.slice(2).join(' ');

    if (!commandName) {
      return {
        status: 'error',
        action: 'custom',
        operation: 'run',
        message: 'Command name is required for run operation',
      };
    }

    try {
      const customResult = await page.evaluate(
        async ({ commandName, params }) => {
          if (!window.customCommands || !window.customCommands[commandName]) {
            return {
              success: false,
              error: `Custom command '${commandName}' not found`,
            };
          }

          try {
            let parsedParams = params ? JSON.parse(params) : undefined;

            if (params && parsedParams === undefined) {
              parsedParams = params;
            }

            let result;
            if (parsedParams !== undefined) {
              if (Array.isArray(parsedParams)) {
                result = window.customCommands[commandName](...parsedParams);
              } else {
                result = window.customCommands[commandName](parsedParams);
              }
            } else {
              result = window.customCommands[commandName]();
            }

            return {
              success: true,
              result: result,
              command: commandName,
            };
          } catch (error) {
            return {
              success: false,
              error: `Error executing custom command '${commandName}': ${error.message}`,
            };
          }
        },
        { commandName, params: params ? `"${params}"` : undefined }
      );

      return {
        status: 'success',
        action: 'custom',
        operation: 'run',
        data: customResult,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'custom',
        operation: 'run',
        message: error.message,
      };
    }
  } else if (args[0] === 'define') {
    const commandName = args[1];
    const commandCode = args.slice(2).join(' ');

    if (!commandName || !commandCode) {
      return {
        status: 'error',
        action: 'custom',
        operation: 'define',
        message: 'Command name and code are required for define operation',
      };
    }

    try {
      const defineResult = await page.evaluate(
        async ({ commandName, commandCode }) => {
          if (!window.customCommands) {
            window.customCommands = {};
          }

          try {
            const func = new Function(commandCode);

            const commands = func();

            if (typeof commands !== 'object' || commands === null) {
              return {
                success: false,
                error: 'Command definition must return an object with functions',
              };
            }

            window.customCommands[commandName] = commands[commandName];

            if (!window.customCommands[commandName]) {
              return {
                success: false,
                error: `Command '${commandName}' not found in the returned object`,
              };
            }

            return {
              success: true,
              message: `Custom command '${commandName}' defined successfully`,
            };
          } catch (error) {
            return {
              success: false,
              error: `Error defining custom command '${commandName}': ${error.message}`,
            };
          }
        },
        { commandName, commandCode }
      );

      return {
        status: 'success',
        action: 'custom',
        operation: 'define',
        data: defineResult,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'custom',
        operation: 'define',
        message: error.message,
      };
    }
  } else {
    return {
      status: 'error',
      message:
        'Invalid custom operation. Use: custom run <command> [params] or custom define <name> <code>',
    };
  }
}

module.exports = custom;
