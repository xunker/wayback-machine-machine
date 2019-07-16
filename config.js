'use strict';
// maybe https://flaviocopes.com/how-to-merge-objects-javascript/
module.exports = function(yargs) {

  if (!yargs)
    yargs = require('yargs');

  var args = yargs
    .usage('Teleport your browser back in time.\nUsage: $0 [date] --port [num] --debug')
    .example('$0 --date 2006-03-01', 'View the web as if it were March 1st, 2006')
    .default('port', '4080')
    .default('date', '2006-03-01')
    .default('image-colors', undefined, "Reduce image color depth to this number")
    .boolean('gif87a', "Convert all .gif images to GIF87a format")
    .boolean('debug', 'debug/verbose mode')
    .boolean('netscape1', 'Netscape 1.x Mode')
    .boolean('netscape2', 'Netscape 2.x Mode')
    .boolean('ignore-user-agent', 'Ignore client User Agent string for automatic config')
    .boolean('ignore-http-version', 'Ignore HTTP version header passed by client')
    .boolean('proxy-image-redirects', 'If image URL returns redirect, return image data instead of redirect response')
    .boolean('simplify-content-type', 'Simplify content-type response headers')
    .boolean('resolve-missing', 'Attempt to resolve 404s by redirecting to the nearest snaphot')
    .boolean('http1', 'Force HTTP/1.0 requests')
    .boolean('no-cache','disable local caching, and add "pragma: no-cache" response headers')
    .alias('image-colours', 'image-colors')
    .alias('ns1', 'netscape1')
    .alias('ns2', 'netscape2')
    .alias('verbose', 'debug')
    .alias('v', 'debug')
    .argv;

  args.date = args.date.replace(/-/g, '');

  if (parseInt(args.imageColors) > 0) {
    args.imageColors = parseInt(args.imageColors);
  } else {
    args.imageColors = 0;
  }

  if (args.netscape1) {
    args.ignoreUserAgent = true;
    args.ignoreHttpVersion = true;
    args.http1 = true;
    args.gif87a = true;
    args.simplifyContentType = true;
    args.proxyImageRedirects = true;
    if (!args.imageColors)
      args.imageColors = 16;
  }

  if (args.netscape2) {
    args.ignoreUserAgent = true;
    args.ignoreHttpVersion = true;
    args.simplifyContentType = true;
    args.http1 = true;
    if (!args.imageColors)
      args.imageColors = 16;
  }

  return args;
}
