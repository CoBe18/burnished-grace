/* ===========================================================================
   BEATITUDES — click a shop title, the walkthrough movie pops up.
   Burnished Grace Creative Studio
   ---------------------------------------------------------------------------
   Matched to your real markup: shop.js renders each title as
        <h4 id="t-<product-id>">…</h4>
   so this targets the Beatitudes titles by ID (exact, language-aware):
        t-beatitudes-kids / -teen / -adult / -bundle            -> English video
        t-beatitudes-kids-es / -teen-es / -adult-es / -bundle-es -> Spanish video
   Works even though shop.js builds the catalog after load (observer + delegation).

   INSTALL (two edits in your repo, then push):
     1) Add this file to the repo root as  beatitudes-popup.js
     2) In index.html, right AFTER the shop.js line and before </body>, add:
            <script src="beatitudes-popup.js" defer></script>

   HOST THE VIDEOS: put the two composed files where VIDEO_EN / VIDEO_ES point
   (default: a /videos/ folder). They can live in the repo or be uploaded to
   IONOS separately — just match the paths below.

   POP-UP BLOCKERS: this is an in-page overlay, not a browser window, so pop-up
   blockers do NOT block it. Customers don't have to turn anything off.
   =========================================================================== */
(function () {
  var VIDEO_EN = "videos/The_Beatitudes_Walkthrough_English.mp4";
  var VIDEO_ES = "videos/The_Beatitudes_Walkthrough_Spanish.mp4";

  var SELECTOR = '[id^="t-beatitudes-"]';           // the h4 titles shop.js creates
  function videoForEl(el) {
    if (!el || !el.id) return null;
    if (el.id.indexOf('t-beatitudes-') !== 0) return null;
    return /-es$/.test(el.id) ? VIDEO_ES : VIDEO_EN; // any "-es" title -> Spanish
  }

  /* ---- styles ---- */
  var style = document.createElement('style');
  style.textContent =
    SELECTOR + '{cursor:pointer}' +
    SELECTOR + ':hover{text-decoration:underline;text-decoration-color:#c7a24a;text-underline-offset:4px}' +
    '.bgp-modal{position:fixed;inset:0;z-index:99999;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(20,8,12,.80)}' +
    '.bgp-modal.open{display:flex}' +
    '.bgp-dialog{position:relative;width:min(960px,100%);background:#120a0d;border-radius:14px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.5);border:1px solid rgba(199,162,74,.35)}' +
    '.bgp-bar{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#1b0f13}' +
    '.bgp-bar .t{color:#f7f1e6;font-weight:600;font-size:15px;font-family:inherit}' +
    '.bgp-close{border:0;background:transparent;color:#e4c87f;font-size:26px;line-height:1;cursor:pointer;width:40px;height:40px;border-radius:8px}' +
    '.bgp-close:hover{background:rgba(199,162,74,.15)}' +
    '.bgp-video{display:block;width:100%;height:auto;max-height:78vh;background:#000}';
  document.head.appendChild(style);

  /* ---- popup ---- */
  var modal = document.createElement('div');
  modal.className = 'bgp-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Video player');
  modal.innerHTML =
    '<div class="bgp-dialog"><div class="bgp-bar"><span class="t"></span>' +
    '<button class="bgp-close" aria-label="Close video">&times;</button></div>' +
    '<video class="bgp-video" controls playsinline preload="none"></video></div>';
  function attach(){ if (document.body) document.body.appendChild(modal); }
  if (document.body) attach(); else document.addEventListener('DOMContentLoaded', attach);

  var video = modal.querySelector('.bgp-video');
  var titleEl = modal.querySelector('.bgp-bar .t');
  var closeBtn = modal.querySelector('.bgp-close');
  var lastFocus = null;

  function open(src, title) {
    lastFocus = document.activeElement;
    titleEl.textContent = title || '';
    video.src = src;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
    var p = video.play(); if (p && p.catch) p.catch(function(){});
  }
  function close() {
    modal.classList.remove('open');
    video.pause(); video.removeAttribute('src'); video.load();
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---- click (delegated, works for titles rendered later) ---- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest ? e.target.closest(SELECTOR) : null;
    var src = videoForEl(el);
    if (!src) return;
    e.preventDefault();
    open(src, el.textContent.trim());
  });

  /* ---- make the titles look clickable + keyboard-openable ---- */
  function decorate(root) {
    (root || document).querySelectorAll(SELECTOR).forEach(function (el) {
      if (videoForEl(el) && !el.hasAttribute('data-bgp')) {
        el.setAttribute('data-bgp', '1');
        el.setAttribute('role', 'button');
        if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      }
    });
  }
  function ready(fn){ if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }
  ready(function () {
    decorate(document);
    if (window.MutationObserver && document.body) {
      new MutationObserver(function () { decorate(document); })
        .observe(document.body, { childList: true, subtree: true });
    }
  });

  document.addEventListener('keydown', function (e) {
    var a = document.activeElement;
    if ((e.key === 'Enter' || e.key === ' ') && a && a.matches && a.matches(SELECTOR)) {
      var src = videoForEl(a);
      if (src) { e.preventDefault(); open(src, a.textContent.trim()); }
    }
    if (e.key === 'Escape' && modal.classList.contains('open')) close();
  });
  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
})();
