async function worker(page, args) {
  if (args[0] === 'start') {
    const workerName = args[1] || 'defaultWorker';

    try {
      const workerStarted = await page.evaluate((workerName) => {
        if (window.workersMap && window.workersMap[workerName]) {
          return { workerExists: true, name: workerName };
        } else {
          return { workerStarted: true, name: workerName };
        }
      }, workerName);

      return {
        status: 'success',
        action: 'worker',
        operation: 'start',
        data: workerStarted,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'worker',
        operation: 'start',
        message: error.message,
      };
    }
  } else if (args[0] === 'postMessage') {
    const workerName = args[1];
    const message = args.slice(2).join(' ');

    if (!workerName || !message) {
      return {
        status: 'error',
        action: 'worker',
        operation: 'postMessage',
        message: 'Worker name and message are required for postMessage operation',
      };
    }

    try {
      await page.evaluate(
        ({ workerName, message }) => {
          if (window.workersMap && window.workersMap[workerName]) {
            window.workersMap[workerName].postMessage(JSON.parse(message));
            return { success: true, worker: workerName, message: message };
          } else {
            throw new Error(`Worker ${workerName} not found`);
          }
        },
        { workerName, message }
      );

      return {
        status: 'success',
        action: 'worker',
        operation: 'postMessage',
        workerName: workerName,
        message: message,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'worker',
        operation: 'postMessage',
        message: error.message,
      };
    }
  } else if (args[0] === 'terminate') {
    const workerName = args[1];

    if (!workerName) {
      return {
        status: 'error',
        action: 'worker',
        operation: 'terminate',
        message: 'Worker name is required for terminate operation',
      };
    }

    try {
      await page.evaluate((workerName) => {
        if (window.workersMap && window.workersMap[workerName]) {
          window.workersMap[workerName].terminate();
          delete window.workersMap[workerName];
          return { success: true, worker: workerName };
        } else {
          throw new Error(`Worker ${workerName} not found`);
        }
      }, workerName);

      return {
        status: 'success',
        action: 'worker',
        operation: 'terminate',
        workerName: workerName,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'worker',
        operation: 'terminate',
        message: error.message,
      };
    }
  } else {
    return {
      status: 'error',
      message:
        'Invalid worker operation. Use: worker start [name], worker postMessage <name> <message>, or worker terminate <name>',
    };
  }
}

module.exports = worker;
