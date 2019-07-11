'use strict';
var transformerProxy = require('transformer-proxy');

var args = require('yargs')
  .usage('Teleport your browser back in time.\nUsage: $0 [date] --port [num] --debug')
  .example('$0 --date 2006-03-01', 'View the web as if it were March 1st, 2006')
  .default('port', '4080')
  .default('date', '2006-03-01')
  .argv;

// Get options
var date = args.date;
var port = args.port;
var log = require('./lib/log').init(args.debug).log;

// Print banner & Usage
var ascli = require('ascli').app(require('./package').name.replace(/-/g, '  '));
ascli.banner(ascli.appName.rainbow.bold);
var msee = require('msee');
var usage = msee.parseFile(process.cwd() + '/USAGE.md');
console.log(usage.replace(/<port>/g, port).replace(/<date>/g, new Date(date).toLocaleDateString()));

// Start local proxy server.
var proxyToWayback = require('./lib/proxy');
var http = require('http');
var express = require('express');
var app = express();

/**
 * Doesn't change the request or response, just reports values in them if
 * debugging is enabled.
 *
 * @param {Stream} data Response body
 * @param {ServerRequest} req The incoming HTTP request object
 * @param {ServerResponse} res The outgoing HTTP response object
 * @returns {string|Steam} New or changed response body
 */
var debugTransactionDetails = function (data, req, res) {
  log('=== Begin Transaction Details:');
  log("Incoming URL: " + req.url);
  log("Outgoing Content-Type: " + res.getHeader('content-type'));
  log("Outgoing Status Code: " + res.statusCode);
  log('=== End Transaction Details:');
  return data;
}

/**
 * Removes the HTML/CSS/JS injected by Wayback. Old browsers can't understand
 * it anyway, and old computers choke on the sheer amount of data returned.
 *
 * @param {Stream} data Response body
 * @param {ServerRequest} req The incoming HTTP request object
 * @param {ServerResponse} res The outgoing HTTP response object
 * @returns {string|Steam} New or changed response body
 */
var removeWaybackDecoration = function (data, req, res) {
  // return data + "\n // an additional line at the end of every file";
  // return "WOOT";

  if (!res.getHeader('content-type').match(/text/)) {
    return data;
  }

  /*
  TODO Netscape 1.0 can't handle getting a 302 redirect for an image response.
  Example:
    web.archive.org/web/19961220045225im_/http://compuserve.com/images/wowies.gif
    redirect to
    http://web.archive.org/web/19961220045319im_/http://www.compuserve.com/images/wowies.gif

  Find a way to transparently proxy it, but for images only.
  */

  var body = data.toString();

  if (body.match(/BEGIN WAYBACK TOOLBAR INSERT/g)) {
    // remove the wayback machine decoration
    body = body.replace(/<!-- BEGIN WAYBACK TOOLBAR INSERT.*END WAYBACK TOOLBAR INSERT --\>/s, '')
  }

  if (body.match(/End Wayback Rewrite JS Include/)) {
    console.log("====================");
    // remove the wayback machine js
    body = body.replace(/<head\>.+<!-- End Wayback Rewrite JS Include --\>/s, '<head>')
  }

  body = body.replace(/<script type="text\/javascript" src="\/_static.+?<\/script\>/g, '');
  return body;
};

app.use(transformerProxy(debugTransactionDetails));
app.use(transformerProxy(removeWaybackDecoration));
app.use(require('cookie-parser')());
app.use(proxyToWayback.bind(null, {date: date.replace(/-/g, '')}));

app.on('error', function(err) {
  console.error("Unable to open port:", port);
});

app.listen(port);

