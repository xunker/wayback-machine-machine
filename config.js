'use strict';
module.exports = function commandLineArgs() {
  var args = require('yargs')
    .usage('Teleport your browser back in time.\nUsage: $0 [date] --port [num] --debug')
    .example('$0 --date 2006-03-01', 'View the web as if it were March 1st, 2006')
    .default('port', '4080')
    .default('date', '2006-03-01')
    .default('image-colors', undefined, "Reduce image color depth to this number")
    .alias('image-colours', 'image-colors')
    .boolean('gif87a', "Convert all .gif images to GIF87a format")
    .boolean('debug', 'debug/verbose mode')
    .boolean('netscape1', 'Netscape 1.x Mode (--gif87a --http1 --proxy-image-redirects --image-colors=16)')
    .alias('ns1', 'netscape1')
    .boolean('netscape2', 'Netscape 2.x Mode (--http1 --image-colors=16)')
    .alias('ns2', 'netscape2')
    .boolean('ignore-user-agent', 'Ignore client User Agent string for automatic config')
    .boolean('ignore-http-version', 'Ignore HTTP version header passed by client')
    .boolean('proxy-image-redirects', 'If image URL returns redirect, return image data instead of redirect response')
    .boolean('http1', 'Force HTTP/1.0 requests')
    .boolean('http11', 'Force HTTP/1.1 requests')
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
    args.proxyImageRedirects = true;
    if (!args.imageColors)
      args.imageColors = 16;
  }

  if (args.netscape2) {
    args.ignoreUserAgent = true;
    args.ignoreHttpVersion = true;
    args.http1 = true;
    if (!args.imageColors)
      args.imageColors = 16;
  }

  return args;
}();
