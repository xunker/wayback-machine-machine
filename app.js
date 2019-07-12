'use strict';
var transformerProxy = require('transformer-proxy');

var gm = require('gm');

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
var fs = require('fs'); // temp removeme
/**
 * Doesn't change the request or response, just reports values in them if
 * debugging is enabled.
 *
 * @param {Buffer} data Response body
 * @param {IncommingMessage} req The incoming HTTP request object
 * @param {ServerResponse} res The outgoing HTTP response object
 * @returns {string|Steam} New or changed response body
 */
var debugTransactionDetails = function (data, req, res) {
  log('=== Begin Transaction Details:');
  log("Incoming:");
  log("\tHTTP Version: " + req.httpVersion);
  log("\tMethod: " + req.method);
  log("\tURL: " + req.url);
  log("\tHeaders: %j",req.headers);

  log("Outgoing");
  log("\tContent-Type: " + res.getHeader('content-type'));
  log("\tStatus Code: " + res.statusCode);
  log("\tHeaders: " + (function() {
    var out = '';

    res.getHeaderNames().forEach(function (header) {
      out = out + "\n\t\t" + header + ': ' + res.getHeader(header);
    });
    return out;
  })());
  log('=== End Transaction Details:');

  fs.writeFile('./test.gif', data, function (err) {
    if (err) {
      return console.log(err);
    }

    console.log("The file was saved!");
  });

  return data;
}

/**
 * Removes the HTML/CSS/JS injected by Wayback. Old browsers can't understand
 * it anyway, and old computers choke on the sheer amount of data returned.
 *
 * @param {Buffer} data Response body
 * @param {IncommingMessage} req The incoming HTTP request object
 * @param {ServerResponse} res The outgoing HTTP response object
 * @returns {string|Steam} New or changed response body
 */
var removeWaybackDecoration = function (data, req, res) {
  if (!res.getHeader('content-type').match(/text/)) {
    return data;
  }

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

  // remove the wayback machine js
  body = body.replace(/<script type="text\/javascript" src="\/_static.+?<\/script\>/g, '');
  return body;
};

/**
 * Convert GIF images.
 * Changes to the GIF87a format, since Netscape 1.0 can't
 * handle GIF89a images, support for them wasn't added until Netscape 2.0.
 * Lowers the color threshold to {smallNum} colors because you're probably
 * viewing them on a 4-bit display anyway.
 *
 * @param {Buffer} data Response body
 * @param {IncommingMessage} req The incoming HTTP request object
 * @param {ServerResponse} res The outgoing HTTP response object
 * @returns {Promise} Function that does the conversion and returns a Buffer
 */
var convertGif8x = function (data, req, res) {
  if (!res.getHeader('content-type').match(/image\/gif/)) {
    return data;
  }

  log("Image is GIF that will be converted")

  return new Promise(function (resolve, reject) {
    return gm(data).out('gif87:-').colors(2).toBuffer('gif87', function (err, buffer) {
      console.log('Converting GIF to GIF87a format, lowering bit depth');
      if (err) {
        reject(err);
      } else {
        resolve(buffer);
      }
    });
  });
}

app.use(transformerProxy(debugTransactionDetails));
app.use(transformerProxy(convertGif8x));
app.use(transformerProxy(removeWaybackDecoration));
app.use(require('cookie-parser')());
app.use(proxyToWayback.bind(null, {date: date.replace(/-/g, '')}));

app.on('error', function(err) {
  console.error("Unable to open port:", port);
});

app.listen(port);

