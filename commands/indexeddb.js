async function indexeddb(page, args) {
  if (args[0] === 'create') {
    const dbName = args[1];
    const version = parseInt(args[2]) || 1;

    if (!dbName) {
      return {
        status: 'error',
        action: 'indexeddb',
        operation: 'create',
        message: 'Database name is required for create operation',
      };
    }

    try {
      const dbResult = await page.evaluate(
        async ({ dbName, version }) => {
          if (!window.indexedDB) {
            return {
              success: false,
              error: 'IndexedDB not supported',
            };
          }

          return new Promise((resolve) => {
            const request = window.indexedDB.open(dbName, version);

            request.onerror = (event) => {
              resolve({
                success: false,
                error: event.target.error?.message || 'Unknown error',
              });
            };

            request.onsuccess = (event) => {
              const db = event.target.result;
              resolve({
                success: true,
                dbName: db.name,
                version: db.version,
              });
            };

            request.onupgradeneeded = (event) => {
              console.log(`Upgrading database ${dbName} to version ${version}`);
            };
          });
        },
        { dbName, version }
      );

      return {
        status: 'success',
        action: 'indexeddb',
        operation: 'create',
        data: dbResult,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'indexeddb',
        operation: 'create',
        message: error.message,
      };
    }
  } else if (args[0] === 'add') {
    const dbName = args[1];
    const storeName = args[2];
    const dataStr = args.slice(3).join(' ');

    if (!dbName || !storeName || !dataStr) {
      return {
        status: 'error',
        action: 'indexeddb',
        operation: 'add',
        message: 'Database name, store name, and data are required for add operation',
      };
    }

    try {
      const parsedData = JSON.parse(dataStr);

      const addResult = await page.evaluate(
        async ({ dbName, storeName, data }) => {
          if (!window.indexedDB) {
            return {
              success: false,
              error: 'IndexedDB not supported',
            };
          }

          return new Promise((resolve) => {
            const request = window.indexedDB.open(dbName);

            request.onerror = (event) => {
              resolve({
                success: false,
                error: event.target.error?.message || 'Failed to open database',
              });
            };

            request.onsuccess = (event) => {
              const db = event.target.result;

              const transaction = db.transaction([storeName], 'readwrite');
              const store = transaction.objectStore(storeName);

              const addRequest = store.add(data);

              addRequest.onsuccess = () => {
                resolve({
                  success: true,
                  id: addRequest.result,
                });
              };

              addRequest.onerror = (event) => {
                resolve({
                  success: false,
                  error: event.target.error?.message || 'Failed to add data',
                });
              };
            };
          });
        },
        { dbName, storeName, data: parsedData }
      );

      return {
        status: 'success',
        action: 'indexeddb',
        operation: 'add',
        data: addResult,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'indexeddb',
        operation: 'add',
        message: error.message,
      };
    }
  } else if (args[0] === 'get') {
    const dbName = args[1];
    const storeName = args[2];
    const key = args[3];

    if (!dbName || !storeName) {
      return {
        status: 'error',
        action: 'indexeddb',
        operation: 'get',
        message: 'Database name and store name are required for get operation',
      };
    }

    try {
      const getResult = await page.evaluate(
        async ({ dbName, storeName, key }) => {
          if (!window.indexedDB) {
            return {
              success: false,
              error: 'IndexedDB not supported',
            };
          }

          return new Promise((resolve) => {
            const request = window.indexedDB.open(dbName);

            request.onerror = (event) => {
              resolve({
                success: false,
                error: event.target.error?.message || 'Failed to open database',
              });
            };

            request.onsuccess = (event) => {
              const db = event.target.result;

              const transaction = db.transaction([storeName], 'readonly');
              const store = transaction.objectStore(storeName);

              let getRequest;
              if (key) {
                getRequest = store.get(parseInt(key) || key);
              } else {
                getRequest = store.getAll();
              }

              getRequest.onsuccess = () => {
                resolve({
                  success: true,
                  data: getRequest.result,
                });
              };

              getRequest.onerror = (event) => {
                resolve({
                  success: false,
                  error: event.target.error?.message || 'Failed to get data',
                });
              };
            };
          });
        },
        { dbName, storeName, key }
      );

      return {
        status: 'success',
        action: 'indexeddb',
        operation: 'get',
        data: getResult,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'indexeddb',
        operation: 'get',
        message: error.message,
      };
    }
  } else if (args[0] === 'delete') {
    const dbName = args[1];

    if (!dbName) {
      return {
        status: 'error',
        action: 'indexeddb',
        operation: 'delete',
        message: 'Database name is required for delete operation',
      };
    }

    try {
      const deleteResult = await page.evaluate(async (dbName) => {
        if (!window.indexedDB) {
          return {
            success: false,
            error: 'IndexedDB not supported',
          };
        }

        return new Promise((resolve) => {
          const deleteReq = window.indexedDB.deleteDatabase(dbName);

          deleteReq.onsuccess = () => {
            resolve({
              success: true,
              message: `Database ${dbName} deleted`,
            });
          };

          deleteReq.onerror = (event) => {
            resolve({
              success: false,
              error: event.target.error?.message || 'Failed to delete database',
            });
          };

          deleteReq.onblocked = () => {
            resolve({
              success: false,
              error: 'Database deletion blocked, possibly due to open connections',
            });
          };
        });
      }, dbName);

      return {
        status: 'success',
        action: 'indexeddb',
        operation: 'delete',
        data: deleteResult,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'indexeddb',
        operation: 'delete',
        message: error.message,
      };
    }
  } else {
    return {
      status: 'error',
      message:
        'Invalid indexeddb operation. Use: indexeddb create <name> [version], indexeddb add <dbname> <storename> <data>, indexeddb get <dbname> <storename> [key], or indexeddb delete <name>',
    };
  }
}

module.exports = indexeddb;
