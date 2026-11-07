/* Samtykke til besøgsstatistik med vores egen tæller (data.vantagesystems.dk/t/hit, se panel/server/taeller.py).
   Intet sendes, før besøgende har trykket "Accept". Valget gemmes kun i browseren (localStorage) i 12 måneder
   og kan ændres via "Privacy settings". Åbn siden med ?intern=1 for at slå tælling fra i egen browser (?intern=0 slår til igen). */
(function () {
  'use strict';
  var ENDPOINT = 'https://data.vantagesystems.dk/t/hit';
  var KEY = 'vs-consent';
  var VERSION = 2;
  var MAX_AGE = 365 * 24 * 60 * 60 * 1000;

  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!c || c.ver !== VERSION || (c.v !== 'yes' && c.v !== 'no') || typeof c.t !== 'number') return null;
      if (Date.now() - c.t > MAX_AGE) return null;
      return c.v;
    } catch (e) { return null; }
  }

  function save(v) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now(), ver: VERSION })); } catch (e) {}
  }

  function intern() {
    try {
      if (/[?&]intern=1(&|$)/.test(location.search)) localStorage.setItem('vs-intern', '1');
      if (/[?&]intern=0(&|$)/.test(location.search)) localStorage.removeItem('vs-intern');
      return localStorage.getItem('vs-intern') === '1';
    } catch (e) { return false; }
  }

  var sent = false;
  function count() {
    if (sent || intern()) return;
    if (document.prerendering) {
      document.addEventListener('prerenderingchange', count, { once: true });
      return;
    }
    sent = true;
    try {
      fetch(ENDPOINT, {
        method: 'POST', mode: 'cors', credentials: 'omit', keepalive: true,
        body: JSON.stringify({ s: location.pathname, r: document.referrer })
      }).catch(function () {});
    } catch (e) {}
  }

  var css = '' +
    '.vs-consent{position:fixed;z-index:9999;left:max(16px,env(safe-area-inset-left,0px));right:max(16px,env(safe-area-inset-right,0px));' +
    'bottom:calc(16px + env(safe-area-inset-bottom,0px));max-width:420px;background:#13233A;color:#F4F6F8;border:1px solid rgba(244,246,248,.18);' +
    'border-radius:14px;padding:18px 18px 16px;box-shadow:0 18px 50px rgba(0,0,0,.45);font-family:"Geist","Helvetica Neue",Arial,sans-serif;' +
    'font-weight:300;font-size:14px;line-height:1.55}' +
    '.vs-consent h2{margin:0 0 6px;font-family:"Geist Mono",ui-monospace,Menlo,monospace;font-weight:400;font-size:11px;letter-spacing:.18em;' +
    'text-transform:uppercase;color:#F3D9C6}' +
    '.vs-consent p{margin:0 0 14px;color:#B9C5D2}' +
    '.vs-consent a{color:#F3D9C6;text-underline-offset:3px}' +
    '.vs-consent .row{display:flex;gap:10px}' +
    '.vs-consent button{flex:1;min-height:44px;border-radius:999px;border:1px solid rgba(244,246,248,.5);background:transparent;color:#F4F6F8;' +
    'font:inherit;font-weight:400;font-size:14px;cursor:pointer}' +
    '.vs-consent button:hover{background:rgba(244,246,248,.08)}' +
    '.vs-consent button:focus-visible{outline:2px solid #F3D9C6;outline-offset:3px}';

  var box = null;
  function show() {
    if (box) { box.querySelector('button').focus(); return; }
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
    box = document.createElement('section');
    box.className = 'vs-consent';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', 'Visitor statistics consent');
    box.innerHTML =
      '<h2>Visitor statistics</h2>' +
      '<p>Vantage Systems I/S would like to count visits to this site on our own server in Germany, hosted by Hetzner. ' +
      'No cookies, and your IP address is not stored. We record the time, page, referring site, browser, operating system and device type, ' +
      'plus a code that changes daily so we can count unique visitors; the code is deleted within two days, leaving only anonymous totals. ' +
      'Nothing is sent unless you accept. Your choice is kept in this browser for 12 months, and you can change or withdraw it any time under ' +
      '"Privacy settings" at the bottom of the page. <a href="privacy.html#statistics">Read more</a>.</p>' +
      '<div class="row"><button type="button" data-v="no">Decline</button><button type="button" data-v="yes">Accept</button></div>';
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-v]');
      if (!b) return;
      var v = b.getAttribute('data-v');
      save(v);
      box.remove();
      box = null;
      if (v === 'yes') count();
    });
    document.body.appendChild(box);
  }

  function init() {
    document.querySelectorAll('[data-consent-open]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); show(); });
    });
    var v = read();
    if (v === 'yes') count();
    else if (v === null) show();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
