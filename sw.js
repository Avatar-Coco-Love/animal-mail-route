// Service worker: lets the game install and play offline.
// Bump VERSION on every release so phones drop the old cache and fetch the new files.
// Only same-origin GET requests are handled; play counts (a POST to another site) pass straight through.
var VERSION = 'amr-v20';
var CORE = [
  './', 'index.html', 'privacy.html', 'manifest.webmanifest',
  'es/', 'es/manifest.webmanifest', 'privacy-es.html',
  'fonts/baloo2-latin.woff2', 'fonts/nunito-latin.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/icon.svg',
  'words.js', 'volunteer.html',
  'audio/en/female/clips.json', 'audio/en/male/clips.json', 'audio/es/female/clips.json', 'audio/es/male/clips.json'
];
// Each voice set's clips folder: audio/<language>/<female|male>/ (see AMR.VOICE_SETS in words.js)
var AUDIO = ['audio/en/female/', 'audio/en/male/', 'audio/es/female/', 'audio/es/male/'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(VERSION).then(function(cache){
    return cache.addAll(CORE).then(function(){
      // Voice clips: cache every clip each clips.json lists. A missing clip is skipped, not fatal.
      return Promise.all(AUDIO.map(function(dir){
        return fetch(dir + 'clips.json').then(function(r){ return r.json(); }).then(function(list){
          return Promise.all((Array.isArray(list) ? list : []).map(function(k){
            return cache.add(dir + k + '.mp3').catch(function(){});
          }));
        }).catch(function(){});
      }));
    });
  }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== VERSION; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

// Stale while revalidate: answer from the cache at once (works offline), refresh it from the network behind.
self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(caches.open(VERSION).then(function(cache){
    return cache.match(req, {ignoreSearch: true}).then(function(hit){
      var net = fetch(req).then(function(res){
        if(res && res.ok && res.type === 'basic') cache.put(req, res.clone());
        return res;
      });
      if(hit){ e.waitUntil(net.catch(function(){})); return hit; }
      return net.catch(function(){
        return req.mode === 'navigate' ? cache.match('index.html') : Response.error();
      });
    });
  }));
});
