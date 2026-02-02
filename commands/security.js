async function security(page, args) {
  if (args[0] === 'headers') {
    try {
      const securityHeaders = await page.evaluate(() => {
        const features = {
          isSecureContext: window.isSecureContext,
          protocol: window.location.protocol,
          hasStrictTransportSecurity: document.createElement('a').href.startsWith('https://'),
          hasContentSecurityPolicy: !!document.querySelector(
            'meta[http-equiv="Content-Security-Policy"], meta[name="Content-Security-Policy"]'
          ),
          hasPermissionsPolicy: !!document.querySelector(
            'meta[http-equiv="Permissions-Policy"], meta[name="Permissions-Policy"]'
          ),
          hasReferrerPolicy: !!document.querySelector('meta[name="referrer"]'),
          hasXContentTypeOptions: false,
          hasXFrameOptions: false,
          hasXSSProtection: false,
        };

        return features;
      });

      return {
        status: 'success',
        action: 'security',
        operation: 'headers',
        data: securityHeaders,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'security',
        operation: 'headers',
        message: error.message,
      };
    }
  } else if (args[0] === 'mixedContent') {
    try {
      const mixedContent = await page.evaluate(() => {
        const issues = [];

        const images = document.querySelectorAll('img');
        images.forEach((img) => {
          if (img.src && img.src.startsWith('http:')) {
            issues.push({
              type: 'image',
              src: img.src,
              element: img.tagName,
            });
          }
        });

        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach((script) => {
          if (script.src && script.src.startsWith('http:')) {
            issues.push({
              type: 'script',
              src: script.src,
              element: script.tagName,
            });
          }
        });

        const links = document.querySelectorAll('link[rel="stylesheet"]');
        links.forEach((link) => {
          if (link.href && link.href.startsWith('http:')) {
            issues.push({
              type: 'stylesheet',
              src: link.href,
              element: link.tagName,
            });
          }
        });

        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe) => {
          if (iframe.src && iframe.src.startsWith('http:')) {
            issues.push({
              type: 'iframe',
              src: iframe.src,
              element: iframe.tagName,
            });
          }
        });

        return {
          totalIssues: issues.length,
          issues: issues,
        };
      });

      return {
        status: 'success',
        action: 'security',
        operation: 'mixedContent',
        data: mixedContent,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'security',
        operation: 'mixedContent',
        message: error.message,
      };
    }
  } else if (args[0] === 'report') {
    try {
      const securityReport = await page.evaluate(() => {
        const report = {};

        report.headers = {
          isSecureContext: window.isSecureContext,
          protocol: window.location.protocol,
          hasContentSecurityPolicy: !!document.querySelector(
            'meta[http-equiv="Content-Security-Policy"], meta[name="Content-Security-Policy"]'
          ),
          hasPermissionsPolicy: !!document.querySelector(
            'meta[http-equiv="Permissions-Policy"], meta[name="Permissions-Policy"]'
          ),
          hasReferrerPolicy: !!document.querySelector('meta[name="referrer"]'),
        };

        const mixedContentIssues = [];
        const elementsToCheck = [
          { selector: 'img', srcAttr: 'src' },
          { selector: 'script[src]', srcAttr: 'src' },
          { selector: 'link[rel="stylesheet"]', srcAttr: 'href' },
          { selector: 'iframe', srcAttr: 'src' },
        ];

        elementsToCheck.forEach((el) => {
          document.querySelectorAll(el.selector).forEach((elem) => {
            const src = elem[el.srcAttr];
            if (src && src.startsWith('http:')) {
              mixedContentIssues.push({
                type: el.selector.split(/[\[\]]/)[0] || el.selector,
                src: src,
                element: elem.tagName.toLowerCase(),
              });
            }
          });
        });

        report.mixedContent = {
          totalIssues: mixedContentIssues.length,
          issues: mixedContentIssues,
        };

        const iframeIssues = [];
        document.querySelectorAll('iframe').forEach((iframe) => {
          if (!iframe.hasAttribute('sandbox') && iframe.src) {
            iframeIssues.push({
              src: iframe.src,
              issue: 'Missing sandbox attribute',
            });
          }
        });

        report.iframes = {
          total: document.querySelectorAll('iframe').length,
          issues: iframeIssues,
        };

        return report;
      });

      return {
        status: 'success',
        action: 'security',
        operation: 'report',
        data: securityReport,
      };
    } catch (error) {
      return {
        status: 'error',
        action: 'security',
        operation: 'report',
        message: error.message,
      };
    }
  } else {
    return {
      status: 'error',
      message:
        'Invalid security operation. Use: security headers, security mixedContent, or security report',
    };
  }
}

module.exports = security;
