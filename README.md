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
* Caches data to disk to the cache persists between runs, so it will ne nicer to the wayback machine
* Rewrites Content-Type response headers that look like `<mime-type>; encoding=utf8` in to just `<mime-type>` for compatibility with older browsers
* Adds `Host` request header for compatibility with HTTP/1.0 browsers
  * Added in HTTP/1.1. May not be important since we're only talking to Wayback/Archive, but what the hell
* Removes the JS/CSS/HTML decorations that Wayback injects in to pages, old browsers/machine can't handle it

TODO
----

Need
====

* Update dependencies
* Update docs

Old Browser/Computer support (Netscape 1.0, HTTP/1.0)
* [ ] Clean up code that fixes 'Content-Type' responses for remote content
  * Share code with `send(<error>)` code if we can't eliminate the need
* [ ] Clean up code that fixes 'Content-Type' responses from internal 404/500 errors
  * Hacked working, but the better option would be to change the `send(<error>)` to send the correct style of header in the first place
  * Share code with other fix if we can't eliminate the need
* [ ]Clean up `Host` header injection
  * [ ] Don't add it if already present
  * [ ] Refactor code, made it better
  * [ ] Add tests
* [ ] Clean up code that removes the decorations that Wayback injects
* [ ] Proxy image requests that return a redirect
  * Netscape 1.0 can't handle it when an `<img>` tag returns a redirect, so proxy those instead
* [ ] Command-line switch to set Netscape 1.0 compatibility mode
  * option to turn on/off Content-type fixing, Response Cleanup, Host header, etc, individually or all at once using a compund flag


Nice-to-have
============
* Tests
* Make `queryURL()` not have to use *async* in order for node-persist to work.
* Make persistant cache be optional via CLI switch
  * Way to set cache TTL via CLI switch
* Reject 'HTTP CONNECT' request if we get one
* Disk-based caching
  * Update existing memory cache to write to disk
  * Cache data *before* and alterations or conversions, not after
  * These almost *never* need to expire
* Resample images while keeping dimensions and format
  * reduce file size
  * convert interlaced images to non-interlaced (optional, needed?)
  * reduce colors to reduce file size and to do better dithering/conversion than the old browsers
  * command-line switch for this, and/or detect from User Agent string?
* Automatically apply Netscape 1.0 compatibility mode when detected via User Agent
* Test with Netscape 0.9 and HTTP/0.9
* Use libXML or something similar to process and convert document as HTML instead of just strings

Etc
---

Test command: `curl -v -x http://127.0.0.1:4080 http://apple.com`
