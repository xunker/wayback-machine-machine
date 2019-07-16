'use strict';

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

  var log = require('./lib/log').init(args.debug).log;

  args.date = args.date.replace(/-/g, '');

  args.setImageColors = (colors) => {
    colors = colors || args.imageColors;
    if (parseInt(colors) > 0) {
      args.imageColors = parseInt(colors);
    } else {
      args.imageColors = 0;
    }
  }

  args.setNetscape1 = ()=> {
    log('Setting Netscape 1.x mode');
    args.ignoreUserAgent = true;
    args.ignoreHttpVersion = true;
    args.http1 = true;
    args.gif87a = true;
    args.simplifyContentType = true;
    args.proxyImageRedirects = true;
    if (!args.imageColors)
      args.imageColors = 16;
  }

  args.setNetscape2 = () => {
    log('Setting Netscape 2.x mode');
    args.ignoreUserAgent = true;
    args.ignoreHttpVersion = true;
    args.simplifyContentType = true;
    args.http1 = true;
    if (!args.imageColors)
      args.imageColors = 16;
  }

  args.setImageColors();

  if (args.netscape1)
    args.setNetscape1();

  if (args.netscape2)
    args.setNetscape2();

  /**
   * Choose appropriate settings based on user agent
   *
   * @param {String} userAgent The HTTP_USER_AGENT string from the browser
   */
  args.configFromUserAgent = (userAgent) => {
    userAgent = userAgent.trim();

    var userAgents = [
      [/^Mozilla\/1\.\d+/, 'Netscape 1.x', args.setNetscape1],
      [/^Mozilla\/2\.\d+/, 'Netscape 2.x', args.setNetscape2]
    ]

    var agentDetected = false;
    userAgents.forEach(function (ua) {
      if (userAgent.match(ua[0])) {
        log('User Agent configuration detected: "' + ua[1] + '"');
        agentDetected = true;
        return ua[2]();
      }
    });

    if (!agentDetected)
      console.log('No match for user agent: "' + userAgent + '"');
  }

  /**
   * Choose appropriate settings based on request object. Will also call
   * configFromUserAgent().
   *
   * @param {IncomingMessage} req The incomming request from the browser
   */
  args.configFromRequest = (req) => {
    if (!args.ignoreHttpVersion) {
      if (req.httpVersion == '1.0') {
        log('Automatic request configation detected HTTP/1.0');
        args.http1 = true;
      }
    }

    if (!args.ignoreUserAgent) {
      args.configFromUserAgent(req.headers['user-agent']);
    }
  }


  return args;
}
