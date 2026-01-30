async function type(page, args) {
  await page.fill(args[0], args.slice(1).join(' '));
  return { status: 'success', action: 'type', selector: args[0] };
}

module.exports = type;
