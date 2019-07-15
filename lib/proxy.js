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

module.exports = function DHTMLForTheNewMillennium(req, res, next) {
  // This is where we want to go via wayback
  var urlObj = urlTools.parse(req.url);

  // Get the cookie we set so we don't have to hammer the wayback api.
  var waybackCookie = req.cookies['wayback' + urlObj.host + config.date];
  // Don't send our users' cookies if they forget to use incognito
  delete req.headers.cookie;

  if (waybackCookie) {
    log("Found cookie:", waybackCookie);
    return cyberspace(waybackCookie, urlObj, res);
  } else if (urlObj.pathname.match(/\.(gif|jpeg|jpg|png)$/i)) {
    log("Image Request: " + urlObj.host + urlObj.path);
    return cyberspace(waybackCookie, urlObj, res);
  } else {
    doWaybackQuery(urlObj, res);
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
function doWaybackQuery(urlObj, res) {
  // Get the uri of the nearest snapshot.
  var destURL = urlObj.host + urlObj.path;
  var checkURL = 'http://archive.org/wayback/available?url=' + destURL + '&timestamp=' + config.date;
  log('doWaybackQuery url: ' + checkURL);
  queryURL(checkURL, function(err, response, body) {
    if (err) {
      console.log('Recevied Error: ' + err)
      sendStatus(res, 500, 'Server error - ' + err);
    }
    log('doWaybackQuery response: ' + body);
    // Got the uri, load it and pipe to the response.
    try {
      var bodyObj = JSON.parse(body);
      var ts = bodyObj.archived_snapshots.closest.timestamp;
      var waybackURL = 'http://web.archive.org/web/' + ts + '/';
      cyberspace(waybackURL, urlObj, res);
    } catch(e) {
      console.log('Caught Error: ');
      console.log(e);

      sendStatus(res, 404, 'Not found - The Wayback Machine has no archived snapshots for this timeframe');
    }
  });
}

// Reach into cyberspace, get a page, and deliver it to the user.
function cyberspace(waybackURL, urlObj, res) {
  log("Engaging cyberspace: ");
  log("\twaybackURL: ", waybackURL);
  log("\turlObj: ", JSON.stringify(urlObj));
  // This url is directly within archive.org and doesn't need the wayback url, just proxy it.
  if (/https?:\/\//.test(urlObj.path)) {
    log('\tlocal archive.org hit: http://web.archive.org' + urlObj.path);
    return proxyRequest('http://web.archive.org' + urlObj.path, res);
  }

  log('\tQuerying wayback machine');
  // This url has to go through our saved wayback machine url.
  proxyRequest(waybackURL + urlObj.host + urlObj.path, res, function(response) {
    response.headers['set-cookie'] = 'wayback' + urlObj.host + config.date + '=' + waybackURL;
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


/**
 * Simple proxy wrapper.
 *
 * @param {*} url
 * @param {ServerResponse} res
 * @param {function} intercept Callback optional
 */
function proxyRequest(url, res, intercept) {
  log("proxyRequest: ");
  log('\turl: ' + url);
  log('\tintercept set: ' + !!intercept);

  http.get(url, function(response) {
    if (intercept) intercept(response);

    if (config.proxyImageRedirects) {
      if (response.statusCode == 302 && response.headers['location'].length > 0 && response.headers['location'].match(/\.(gif|jpeg|jpg|png)$/i)) {
        log("Proxying Image 302 Redirect for: " + response.headers['location']);
        proxyRequest(response.headers['location'], res);
        return;
      }
    }

    var newHeaders = {
      'date': response.headers['date'],
      'content-type': response.headers['content-type']
    };

    ['set-cookie', 'cache-control', 'conection', 'server', 'location'].forEach(function (header) {
      if (response.headers[header])
        newHeaders[header] = response.headers[header];
    });

    if (config.simplifyContentType && response.headers['content-type'].match(/\;/)) {
      log('Fixing `Content-type` header: ' + response.headers['content-type'] + ' => ' + response.headers['content-type'].split(';')[0]);
      // Old browsers don't content-type headers like "text/html; charset=utf-8"
      // Remove everything after the first semicolon
      newHeaders['content-type'] = response.headers['content-type'].split(';')[0]
    }

    if (response.headers['transfer-encoding']) {
      if (config.http1) {
        log('Converting "transfer-encoding=chunked" to "content-length"');
        var bodyLength = response.toString().length;
        log(bodyLength);
        newHeaders['content-length'] = bodyLength;
        newHeaders['connection'] = 'close';
      } else {
        nweHeaders['transfer-encoding'] = response.headers['transfer-encoding'];
      }
    }

    // res.writeHead(response.statusCode, response.headers);
    res.writeHead(response.statusCode, newHeaders);
    // res.writeHead(response.statusCode, { 'Transfer-Encoding': 'none', 'Content-Length': 926, 'Connection': 'close', 'Content-Type': response.headers['content-type'].split(';')[0]});
    // res.writeHead(response.statusCode, { 'Content-Length': 697, 'Connection': 'close', 'Content-Type': response.headers['content-type'].split(';')[0] });
    response.pipe(res);
  })
  .on('error', function(err) {
    sendStatus(res, 500, 'Server error - ' + err);
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
