'use strict';
var http = require('http');
var log = require('./log').log;
var urlTools = require('url');

// Wayback machine query cache so we're not hammering it.
const storage = require('node-persist');
const cache = storage.create({
  dir: 'cache',
  stringify: JSON.stringify,
  parse: JSON.parse,
  encoding: 'utf8',
  logging: false,  // can also be custom logging function
  ttl: (86400 * 30) * 1000, // ttl* [NEW], can be true for 24h default or a number in MILLISECONDS or a valid Javascript Date object
  expiredInterval: 2 * 60 * 1000, // every 2 minutes the process will clean-up the expired cache

  // in some cases, you (or some other service) might add non-valid storage files to your
  // storage dir, i.e. Google Drive, make this true if you'd like to ignore these files and not throw an error
  forgiveParseErrors: false

});
cache.init();

module.exports = function DHTMLForTheNewMillennium(options, req, res, next) {
  // This is where we want to go via wayback
  var urlObj = urlTools.parse(req.url);

  // Get the cookie we set so we don't have to hammer the wayback api.
  var waybackCookie = req.cookies['wayback' + urlObj.host + options.date];
  // Don't send our users' cookies if they forget to use incognito
  delete req.headers.cookie;

  if (waybackCookie) {
    log("Found cookie:", waybackCookie);
    return cyberspace(options, waybackCookie, urlObj, res);
  } else if (urlObj.pathname.match(/\.(gif|jpeg|jpg|png)$/i)) {
    log("Image Request: " + urlObj.host + urlObj.path);
    return cyberspace(options, waybackCookie, urlObj, res);
  } else {
    doWaybackQuery(urlObj, options, res);
  }
};

/**
 * Responds with a message with a given status and message
 *
 * @param {ServerResponse} response The outgoing response handle
 * @param {number} statusCode The HTTP status code to send
 * @param {string} message Message text to include (plain text)
 * @param {boolean} use_simple_content_type Should we use HTTP/1.0-style content-type headers? (default: true)
 * @returns {undefined}
 */
function sendStatus(response, statusCode, message, use_simple_content_type = true) {
  if (use_simple_content_type) {
    // Instead of using `send()` to return a `statusCode`, we build it by hand
    // to make a HTTP/1.0-compliant Content-type header without semicolons.
    response.writeHead(statusCode, { "Content-Type": "text/plain" });
    response.write(message);
    response.end();
  } else {
    response.send(statusCode)
  }
}

// Ask the wayback machine where the nearest cached page is.
function doWaybackQuery(urlObj, options, res) {
  // Get the uri of the nearest snapshot.
  var destURL = urlObj.host + urlObj.path;
  var checkURL = 'http://archive.org/wayback/available?url=' + destURL + '&timestamp=' + options.date;
  log('doWaybackQuery url: ' + checkURL);
  queryURL(checkURL, function(err, response, body) {
    if (err) {
      console.log('Recevied Error: ' + err)
      sendStatus(res, 500, 'Server error');
    }
    log('doWaybackQuery response:');
    log(body);
    // Got the uri, load it and pipe to the response.
    try {
      var bodyObj = JSON.parse(body);
      var ts = bodyObj.archived_snapshots.closest.timestamp;
      var waybackURL = 'http://web.archive.org/web/' + ts + '/';
      cyberspace(options, waybackURL, urlObj, res);
    } catch(e) {
      console.log('Caught Error: ');
      console.log(e);

      sendStatus(res, 404, 'Not found');
    }
  });
}

// Reach into cyberspace, get a page, and deliver it to the user.
function cyberspace(options, waybackURL, urlObj, res) {
  log("Engaging cyberspace:", waybackURL + JSON.stringify(urlObj));
  // This url is directly within archive.org and doesn't need the wayback url, just proxy it.
  if (/https?:\/\//.test(urlObj.path)) {
    log('local archive.org hit: http://web.archive.org' + urlObj.path);
    return proxyRequest('http://web.archive.org' + urlObj.path, res, {});
  }

  log('Querying wayback machine');
  // This url has to go through our saved wayback machine url.
  proxyRequest(waybackURL + urlObj.host + urlObj.path, res, {}, function(response) {
    response.headers['set-cookie'] = 'wayback' + urlObj.host + options.date + '=' + waybackURL;
  });
}

//
// Helpers
//

// Send a query & cache the results.
// i dont like that this has to be set as async in order to make node-persitance work
async function queryURL(url, cb) {
  var cachedItem = await cache.getItem(url).then(function (data) { return data });
  if (cachedItem) {
    console.log('Cache HIT for "' + url + '"');
    return cb(null, null, cachedItem);
  }

  console.log('Cache MISS for "' + url + '"');
  http.get(url, function (response) {
    parseBody(response, function (body) {
      cache.setItem(url, body);
      cb(null, response, body);
    });
  })
  .on('error', function(err) {
    cb(err);
  });
}

// Simple proxy wrapper.
function proxyRequest(url, res, options = {}, intercept) {
  http.get(url, options, function(response) {
    if (intercept) intercept(response);

    if (response.statusCode == 302 && response.headers['location'].length > 0 && response.headers['location'].match(/\.(gif|jpeg|jpg|png)$/i)) {
      log("Proxying Image 302 Redirect for: " + response.headers['location']);
      proxyRequest(response.headers['location'], res, {});
      return;
    }


    if (response.headers['content-type'].match(/\;/)) {
      log('Fixing `Content-type` header: ' + response.headers['content-type'] + ' => ' + response.headers['content-type'].split(';')[0]);
      // Old browsers don't content-type headers like "text/html; charset=utf-8"
      // Remove everything after the first semicolon
      response.headers['content-type'] = response.headers['content-type'].split(';')[0]
    }

    res.writeHead(response.statusCode, response.headers);
    response.pipe(res);
  })
  .on('error', function(err) {
    sendStatus(res, 500, 'Server error');
  });
}

function parseBody(res, cb) {
  var body = '';
  res.on('data', function(chunk) {
    body += chunk;
  });
  res.on('end', function() {
    cb(body);
  });
}
