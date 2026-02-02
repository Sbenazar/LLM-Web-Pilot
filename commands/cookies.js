async function cookies(page, args, context) {
  if (args[0] === 'clear') {
    await context.clearCookies();
    return { status: 'success', action: 'cookies', operation: 'clear' };
  } else if (args[0] === 'set') {
    const currentUrl = new URL(page.url());
    const domain = currentUrl.hostname || 'localhost';
    const path = currentUrl.pathname.substring(0, currentUrl.pathname.lastIndexOf('/') + 1) || '/';

    await context.addCookies([
      {
        name: args[1],
        value: args.slice(2).join(' '),
        domain: domain.startsWith('.') ? domain : '.' + domain,
        path: path,
        secure: false,
        httpOnly: false,
        sameSite: 'Lax',
      },
    ]);
    return {
      status: 'success',
      action: 'cookies',
      operation: 'set',
      name: args[1],
    };
  } else if (args[0] === 'get') {
    const cookies = await context.cookies();
    const cookie = cookies.find((c) => c.name === args[1]);
    return {
      status: 'success',
      action: 'cookies',
      operation: 'get',
      name: args[1],
      value: cookie ? cookie.value : null,
    };
  } else {
    const allCookies = await context.cookies();
    return {
      status: 'success',
      action: 'cookies',
      operation: 'getAll',
      data: allCookies,
    };
  }
}

module.exports = cookies;
