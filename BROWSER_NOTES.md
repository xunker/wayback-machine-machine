Notes on Browsers
=================

* Netscape 1.12 Mac
  * Sends HTTP/1.0
  * {"user-agent":"Mozilla/1.12(Macintosh; I; PPC)","accept":"*/*, image/gif, image/x-xbitmap, image/jpeg"}
  * IMPORTANT: Running any newer version of Netscape on the same Mac will completely break the 1.12 config/installation and it won't be able to display any content. Delete System Folder -> Preferences -> Netscape f to restore.

* Netscape 2.02 Mac
  * Sends HTTP/1.0 (unexpected!)
  * {"proxy-connection":"Keep-Alive","user-agent":"Mozilla/2.0 (Macintosh; I; PPC)","host":"webcrawler.com","accept":"image/gif, image/x-xbitmap, image/jpeg, image/pjpeg, */*"}

* Netscape 3.03 Gold Mac
  * Sends HTTP/1.0 (very unexpected!)
  {"proxy-connection":"Keep-Alive","user-agent":"Mozilla/3.03Gold (Macintosh; I; PPC)","pragma":"no-cache","host":"webcrawler.com","accept":"image/gif, image/x-xbitmap, image/jpeg, image/pjpeg, */*"}

* Netscape 4.04 Pro Mac
  * Sends HTTP/1.0 (Seriously?)
  {"referer":"http://web.archive.org/web/19981207053653/http://home.netscape.com/home/su_setup.html","proxy-connection":"Keep-Alive","user-agent":"Mozilla/4.04 (Macintosh; I; 68K)","host":"webcrawler.com","accept":"image/gif, image/x-xbitmap, image/jpeg, image/pjpeg, image/png, */*","accept-charset":"iso-8859-1,*,utf-8"}

* Netscape 4.77 Mac
  * Sends HTTP/1.0 (Ok, this is getting ridiculous now)
  {"proxy-connection":"Keep-Alive","user-agent":"Mozilla/4.77C-CCK-MCD {C-UDP; EBM-APPLE} (Macintosh; U; PPC)","host":"webcrawler.com","accept":"image/gif, image/x-xbitmap, image/jpeg, image/pjpeg, image/png, */*","accept-encoding":"gzip","accept-charset":"iso-8859-1,*,utf-8"}

* Internet Explorer 2.1 Mac German
  * Sends HTTP/1.0
  * {"accept":"*/*, q=0.300, audio/wav, audio/x-wav, audio/aiff, audio/x-aiff, audio/basic, multipart/x-mixed-replace, text/url, text/plain, text/html","user-agent":"Mozilla/2.0 (compatible; MSIE 2.1; Mac_68000)","accept-language":"de","host":"milk.com","if-modified-since":"Fri, 19 Apr 2019 22:05:30 GMT","pragma":"no-cache"}

* Internet Explorer 4.01 Mac
  * Sends HTTP/1.0
  * {"host":"apple.com","accept":"image/gif, image/x-xbitmap, image/jpeg, image/pjpeg, image/xbm, image/x-jg, */*","accept-language":"en","proxy-connection":"Keep-Alive","user-agent":"Mozilla/4.0 (compatible; MSIE 4.01; Mac_68000)","ua-os":"MacOS","ua-cpu":"68K","extension":"Security/Remote-Passphrase"}

* Internet Explorer 5.0 (2022) Mac
  * Sends HTTP/1.0
  * accept:"*/*"
  * proxy-connection: "Keep-Alive"
  * user-agent: "Mozilla/4.0 (compatible; MSIE 5.0; Mac_PowerPC)"

* Classilla 9.3.3
  * Sends HTTP/1.1
  * user-agent: "NokiaN90-1/3.0545.5.1 Series60/2.8 Profile/MIDP-2.0 Configuration/CLDC-1.1 (en-US; rv:9.3.3) Clecko/20141026 Classilla/CFM"
  * accept: "text/xml,application/xml,application/xhtml+xml,text/html;q=0.9,text/plain;q=0.8,video/x-mng,image/png,image/jpeg,image/gif;q=0.2,*/*;q=0.1"
  accept-encoding: "gzip,deflate"
  accept-charset: "ISO-8859-1,utf-8;q=0.7,*;q=0.7"
  connection: "close"
  proxy-connection: "close"
