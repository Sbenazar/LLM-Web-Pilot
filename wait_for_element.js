/**
 * LLM-Web-Pilot utility function for waiting for an element
 * Waits for an element to become available and enabled on the page
 */
async (selector, options = {}) => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const timeout = options.timeout || 10000; // Default 10 seconds timeout
    const checkInterval = options.interval || 200; // Default 200ms interval

    const checkElement = setInterval(() => {
      const elements = Array.from(document.querySelectorAll(selector));
      const element = elements.find(el =>
        !el.disabled && (options.checkEnabled ? !el.disabled : true)
      );

      if (element) {
        clearInterval(checkElement);
        resolve({
          status: 'success',
          found: true,
          waited: Date.now() - startTime,
          element: element.tagName
        });
      }

      if (Date.now() - startTime > timeout) {
        clearInterval(checkElement);
        resolve({
          status: 'timeout',
          found: false,
          waited: Date.now() - startTime,
          element: null
        });
      }
    }, checkInterval);
  });
};
