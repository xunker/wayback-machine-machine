Wayback-Machine-Machine
=======================

What
----

Go back in time. The wayback-machine-machine is a proxy server that proxies data through
the [Wayback Machine](https://archive.org/help/wayback_api.php).

You can enter any URL you like into your browser and view the Internet
as though it were a different year.

![cnn.png](cnn.png)

Usage
-----

Start the proxy server:

```bash
git clone git@github.com:STRML/wayback-machine-machine.git
cd wayback-machine-machine
npm install
node app --date 2006-03-01 # View the web as of Mar 1st, 2006
```

Configure your browser to use an *HTTP Proxy* at `localhost:4080`.
Enjoy the information superhighway!

Changes from Upstream
---------------------
* Caches API calls to disk to the cache persists between runs, so it will ne nicer to the wayback machine
* Rewrites Content-Type response headers that look like `<mime-type>; encoding=utf8` in to just `<mime-type>` for compatibility with older browsers
  * Added in HTTP/1.1. May not be important since we're only talking to Wayback/Archive, but what the hell
* Removes the JS/CSS/HTML decorations that Wayback injects in to pages, old browsers/machine can't handle it

TODO
----

Netscape 1.0 can't handle getting a 302 redirect for an image response.
Example:

    http://web.archive.org/web/19961220045225im_/http://compuserve.com/images/wowies.gif
    redirects to

    http://web.archive.org/web/19961220045319im_/http://www.compuserve.com/images/wowies.gif

  Must transparently proxy it, but for images only. Must also convert GIF89a to GIF87a for Netscape 1.0

Need
====

* Update dependencies
* Update docs

Old Browser/Computer support (Netscape 1.0, HTTP/1.0)

* [X] Clean up code that fixes 'Content-Type' responses for remote content
  * Share code with `send(<error>)` code if we can't eliminate the need
* [X] Clean up code that fixes 'Content-Type' responses from internal 404/500 errors
  * Hacked working, but the better option would be to change the `send(<error>)` to send the correct style of header in the first place
  * Share code with other fix if we can't eliminate the need
* [ ] Clean up code that removes the decorations that Wayback injects
* [X] Proxy image requests that return a redirect
  * Netscape 1.0 can't handle it when an `<img>` tag returns a redirect, so proxy those instead
* [ ] Command-line switch to set Netscape 1.0 compatibility mode
  * option to turn on/off Content-type fixing, Response Cleanup, image processing, etc, individually or all at once using a compund flag
* Toogle chunked-mode disabling via:
  * [ ] HTTP Version if request header
  * [ ] Command line switch
  * [ ] User Agent detection?
* [ ] Set image color change via CLI
* [ ] Even though the API says there is not a close match (`http://archive.org/wayback/available?url=web.archive.org/web/19961102075439/http://www.uvol.com/www1st&timestamp=19961102`), going to the URL to a page will often redirect you to one that is close. On our 404 page, add an link to go to the bare url (`web.archive.org/web/19961102075439/http://www.uvol.com/www1st`) and let the Wayback machine send a 302 to the nearest match (`http://web.archive.org/web/19961115122722im_/http://www.uvol.com/www1st/`)

Nice-to-have
============
* [x] Convert GIF89a to GIF87a (Netscape 1.0 may have a problem with them)
* Tests
* Make `queryURL()` not have to use *async* in order for node-persist to work.
* Make persistant cache be optional via CLI switch
  * Way to set cache TTL via CLI switch
* Reject 'HTTP CONNECT' request if we get one
* [ ] cache page/file responses as well as api responses
  * Cache data *before* and alterations or conversions, not after
  * These almost *never* need to expire
* Automatically apply Netscape 1.0 compatibility mode when detected via User Agent
* Test with Netscape 0.9 and HTTP/0.9
* Use libXML or something similar to process and convert document as HTML instead of just strings
* Translate jpeg, png, etc, to GIF87a
* Option to change color depth for other image formats

Etc
---

Test command: `curl -v -x http://127.0.0.1:4080 http://apple.com`
