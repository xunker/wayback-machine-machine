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

var transformerFunction = function (data, req, res) {
  // return data + "\n // an additional line at the end of every file";
  // return "WOOT";

  console.log("Status Code: " + res.statusCode);
  if (!res.getHeader('content-type').match(/text/)) {
    return data;
  }

  if (res.getHeader('content-type').match(/\;/)) {
    console.log("T: " + res.getHeader('content-type') + ' => ' + res.getHeader('content-type').split(';')[0]);
    // Old browsers don't content-type headers like "text/html; charset=utf-8"
    // Remove everything after the first semicolon

    res.writeHead(res.statusCode, { 'Content-Type': res.getHeader('content-type').split(';')[0]});
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

  // body = body.replace(/<script src="\/\/archive.org\/includes\/analytics.js\?v=.+" type="text\/javascript"\><\/script\>/, '');
  // body = body.replace(/<script type="text\/javascript">window.addEventListener.+?<\/script\>/, '')
  body = body.replace(/<script type="text\/javascript" src="\/_static.+?<\/script\>/g, '');
  // body = body.replace(/<link rel="stylesheet" type="text\/css" href="\/_static.+?\/>/g, '');
  // body = body.replace(/WB_wombat_Init.+\n/, '');
  // body = body.replace(/__wbhack.init.+\n/, '');
  // body = body.replace(/<script type="text\/javascript">\n<\/script>\n/sg, '');
  return body;
};

app.use(transformerProxy(transformerFunction));
app.use(require('cookie-parser')());
app.use(proxyToWayback.bind(null, {date: date.replace(/-/g, '')}));

app.on('error', function(err) {
  console.error("Unable to open port:", port);
});

app.listen(port);

