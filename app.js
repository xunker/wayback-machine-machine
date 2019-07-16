'use strict';
var transformerProxy = require('transformer-proxy');

var gm = require('gm');
global.config = require('./config')(); // Globals are evil!
var log = require('./lib/log').init(config.debug).log;

// Print banner & Usage
var ascli = require('ascli').app(require('./package').name.replace(/-/g, '  '));
ascli.banner(ascli.appName.rainbow.bold);
var msee = require('msee');
var usage = msee.parseFile(process.cwd() + '/USAGE.md');
console.log(usage.replace(/<port>/g, config.port).replace(/<date>/g, new Date(config.date).toLocaleDateString()));

// Start local proxy server.
var proxyToWayback = require('./lib/proxy');
var http = require('http');
var express = require('express');
var app = express();

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
    // in case target document doesn't have a <head> tag
    body = body.replace(/<html\>.+<!-- End Wayback Rewrite JS Include --\>/s, '<head>')
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

  return new Promise(function (resolve, reject) {
    log("Processing GIF image")
    var img = gm(data);


    if (config.imageColors > 0) {
      log("\tColors will be changed to", config.imageColors);
      img = img.colors(config.imageColors);
    }

    var cb = function (err, buffer) {
      if (err) {
        reject(err);
      } else {
        resolve(buffer);
      }
    };

    if (config.gif87a) {
      console.log("\tConverting to GIF87a format");
      img = img.out('gif87:-');
      return img.toBuffer('gif87', cb);
    } else {
      return img.toBuffer(cb);
    }
  });
}

app.use(transformerProxy(debugTransactionDetails));
app.use(transformerProxy(convertGif8x));
app.use(transformerProxy(removeWaybackDecoration));
app.use(require('cookie-parser')());
app.use(proxyToWayback.bind(null));

app.on('error', function(err) {
  console.error("Unable to open port:", port);
});

app.listen(config.port);

