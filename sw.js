// ONE PROMISE — service worker
//
// Two jobs: make the book readable with no network, and let a listener keep the
// acts they want on the device. It follows the shape Panim's sw.js arrived at,
// including the two bugs that one had to be fixed for — both noted below.
//
// Bump SHELL on every change to a precached file. Without a new cache name a
// returning visitor is served the previous build out of the old cache forever.
var SHELL = 'onepromise-shell-v1';
var AUDIO = 'onepromise-audio-v1';
var FONTS = 'onepromise-fonts-v1';

// The whole site is one file, so this list is short. index.html carries the
// styles, the player and the text; audio/cues.json is what makes the page read
// along; marks/manifest position the chapters.
var PRECACHE = [
  './', 'index.html', 'manifest.webmanifest',
  'audio/cues.json', 'audio/marks_new.json', 'audio/manifest.json',
  'icon-192.png', 'icon-512.png', 'icon-512-maskable.png'
  // NOT here: the nine act files (138 MB — they are downloaded only when the
  // listener asks, see the 'download' message below) and Abraham Stars.jpeg,
  // which is 495 KB of decoration. The text is the product.
];

// Abraham's typefaces come from Google Fonts, cross-origin. Panim self-hosts its
// fonts and its worker returns early on any other origin — do that here and an
// installed, offline copy of this book names three faces it cannot fetch and
// renders the whole thing in a fallback serif. Both Google Fonts origins send
// CORS headers, so their responses can be cached and replayed. Cached
// opportunistically on first visit rather than precached, because the CSS
// decides which subsets are actually needed.
var FONT_ORIGINS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
function isFont(url) { return FONT_ORIGINS.indexOf(url.origin) !== -1; }

self.addEventListener('install', function (e) {
  // cache:'reload' on every precache request. addAll() is allowed to answer from
  // the browser's own HTTP cache, so a returning visitor inside the CDN's
  // max-age window could fill a brand-new SHELL with the very files the bump was
  // meant to replace — and then be served them indefinitely.
  e.waitUntil(caches.open(SHELL).then(function (c) {
    return Promise.all(PRECACHE.map(function (u) {
      return fetch(new Request(u, { cache: 'reload' })).then(function (r) {
        if (r && r.ok) return c.put(u, r);
      }).catch(function () { /* one missing file must not fail the install */ });
    }));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) {
      return k !== SHELL && k !== AUDIO && k !== FONTS;
    }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// A media element seeks with Range requests. A cached Response is a whole file,
// and answering a Range request with a 200 makes seeking fail silently — the
// player looks frozen. Slice the stored body and answer 206.
function sliceRange(request, response) {
  var range = request.headers.get('range');
  if (!range) return Promise.resolve(response);
  return response.arrayBuffer().then(function (buf) {
    var m = /bytes=(\d+)-(\d+)?/.exec(range);
    var start = m ? parseInt(m[1], 10) : 0;
    var end = m && m[2] ? parseInt(m[2], 10) + 1 : buf.byteLength;
    if (start >= buf.byteLength) start = 0;
    if (end > buf.byteLength) end = buf.byteLength;
    return new Response(buf.slice(start, end), {
      status: 206, statusText: 'Partial Content',
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'audio/mp4',
        'Content-Range': 'bytes ' + start + '-' + (end - 1) + '/' + buf.byteLength,
        'Content-Length': String(end - start),
        'Accept-Ranges': 'bytes'
      }
    });
  });
}

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);

  // ---- fonts: cache-first, they never change under a given URL --------------
  if (isFont(url)) {
    e.respondWith(caches.open(FONTS).then(function (c) {
      return c.match(e.request).then(function (hit) {
        if (hit) return hit;
        return fetch(e.request).then(function (res) {
          // opaque responses are fine to store and replay for fonts
          if (res) c.put(e.request, res.clone());
          return res;
        }).catch(function () { return hit; });
      });
    }));
    return;
  }

  if (url.origin !== location.origin) return;

  // ---- audio: served from cache only if the listener downloaded it ----------
  // Never cached as a side effect of playing. A three-hour book is 138 MB and
  // filling a phone silently is not a favour.
  if (url.pathname.indexOf('/audio/') !== -1 && /\.m4a$/.test(url.pathname)) {
    e.respondWith(caches.open(AUDIO).then(function (c) {
      return c.match(url.pathname).then(function (hit) {
        if (hit) return sliceRange(e.request, hit.clone());
        return fetch(e.request);
      });
    }));
    return;
  }

  // ---- navigations are NETWORK-FIRST ---------------------------------------
  // index.html is the one file with no version in its URL, and here it is the
  // ENTIRE site — text, styles, player, cue logic. Served cache-first, a
  // returning visitor gets the old page and a deploy is invisible until the
  // visit after next. It goes to the network and falls back to cache offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(SHELL).then(function (c) { c.put('index.html', copy); });
      }
      return res;
    }).catch(function () {
      return caches.open(SHELL).then(function (c) {
        return c.match('index.html').then(function (hit) { return hit || c.match('./'); });
      });
    }));
    return;
  }

  // ---- everything else: stale-while-revalidate ------------------------------
  e.respondWith(caches.open(SHELL).then(function (c) {
    return c.match(e.request).then(function (hit) {
      var net = fetch(e.request).then(function (res) {
        if (res && res.ok) c.put(e.request, res.clone());
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    });
  }));
});

// ---- the download API the page talks to ------------------------------------
function reply(e, msg) {
  if (e.source && e.source.postMessage) e.source.postMessage(msg);
  else self.clients.matchAll().then(function (cs) {
    cs.forEach(function (c) { c.postMessage(msg); });
  });
}

self.addEventListener('message', function (e) {
  var d = e.data || {};
  if (d.type === 'download' && d.url) {
    e.waitUntil(caches.open(AUDIO).then(function (c) {
      return fetch(new Request(d.url, { cache: 'reload' })).then(function (res) {
        if (!res || !res.ok) throw new Error('fetch failed');
        return c.put(new URL(d.url, location.href).pathname, res);
      });
    }).then(function () { reply(e, { type: 'downloaded', url: d.url, ok: true }); })
      .catch(function () { reply(e, { type: 'downloaded', url: d.url, ok: false }); }));
  } else if (d.type === 'remove' && d.url) {
    e.waitUntil(caches.open(AUDIO).then(function (c) {
      return c.delete(new URL(d.url, location.href).pathname);
    }).then(function () { reply(e, { type: 'removed', url: d.url }); }));
  } else if (d.type === 'removeAll') {
    e.waitUntil(caches.delete(AUDIO)
      .then(function () { reply(e, { type: 'removedAll' }); }));
  } else if (d.type === 'query' && d.urls) {
    e.waitUntil(caches.open(AUDIO).then(function (c) {
      return Promise.all(d.urls.map(function (u) {
        return c.match(new URL(u, location.href).pathname)
          .then(function (hit) { return !!hit; });
      }));
    }).then(function (flags) {
      reply(e, { type: 'cached-state', urls: d.urls, cached: flags });
    }));
  }
});
