async function performance(page, args) {
  if (args[0] === 'metrics') {
    const perfMetrics = await page.evaluate(() => {
      if (!window.performance || !window.performance.getEntriesByType) {
        return { error: 'Performance API not available' };
      }

      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const lcp = performance.getEntriesByType('largest-contentful-paint');

      const metrics = {
        navigation: navigation
          ? {
              domContentLoaded: navigation.domContentLoadedEventEnd,
              loadEvent: navigation.loadEventEnd,
              responseEnd: navigation.responseEnd,
              duration: navigation.duration,
            }
          : null,
        paint: paint.map((p) => ({
          name: p.name,
          startTime: p.startTime,
        })),
        lcp:
          lcp.length > 0
            ? {
                size: lcp[lcp.length - 1].size,
                startTime: lcp[lcp.length - 1].startTime,
              }
            : null,
        custom: window.performanceMetrics || null,
      };

      return metrics;
    });

    return {
      status: 'success',
      action: 'performance',
      operation: 'metrics',
      data: perfMetrics,
    };
  } else if (args[0] === 'timing') {
    const timingInfo = await page.evaluate(() => {
      if (!performance.timing) {
        return { error: 'Navigation Timing API not available' };
      }

      const timing = performance.timing;
      return {
        navigationStart: timing.navigationStart,
        domLoading: timing.domLoading,
        domInteractive: timing.domInteractive,
        domContentLoadedEventEnd: timing.domContentLoadedEventEnd,
        loadEventEnd: timing.loadEventEnd,
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart,
      };
    });

    return {
      status: 'success',
      action: 'performance',
      operation: 'timing',
      data: timingInfo,
    };
  } else {
    return {
      status: 'error',
      message: 'Invalid performance operation. Use: performance metrics or performance timing',
    };
  }
}

module.exports = performance;
