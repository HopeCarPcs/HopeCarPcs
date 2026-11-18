(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sprache (DE/EN), wird gemerkt ---------- */
  var btn = document.getElementById('lang');
  function setLang(l) {
    root.lang = l;
    if (btn) btn.textContent = l === 'de' ? 'EN' : 'DE';
    try { localStorage.setItem('lang', l); } catch (e) {}
  }
  var saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) {}
  setLang(saved === 'en' ? 'en' : 'de');
  if (btn) btn.addEventListener('click', function () { setLang(root.lang === 'de' ? 'en' : 'de'); });

  /* ---------- Hilfsfunktionen ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function bi(de, en) {
    var f = document.createDocumentFragment();
    f.appendChild(el('span', 'de', de || ''));
    f.appendChild(el('span', 'en', en || de || ''));
    return f;
  }
  function path(p) { return String(p || '').replace(/^\/+/, ''); }
  function imgSrc(x) { return typeof x === 'string' ? x : (x && (x.src || x.image || x.path)) || ''; }

  /* ---------- Inhalte laden ---------- */
  fetch('content/site.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      fillContact(d);
      applyLogo(d);
      if (document.getElementById('arbeiten')) { renderHome(d); }
    })
    .catch(function () {
      var m = document.querySelector('main');
      if (m && document.getElementById('arbeiten')) {
        m.appendChild(el('p', 'msg', 'Die Inhalte konnten nicht geladen werden. Bitte Seite neu laden.'));
      }
    });

  function applyLogo(d) {
    var a = document.querySelector('header .logo'); if (!a) return;
    if (d.name) a.textContent = d.name;
    if (d.logo) {
      var im = new Image(); im.src = path(d.logo); im.alt = d.name || 'HopeCarPcs'; im.className = 'logo-img';
      im.onerror = function () { a.textContent = d.name || 'HopeCarPcs'; };
      a.textContent = ''; a.appendChild(im);
    }
  }

  function fillContact(d) {
    var mail = d.contact && d.contact.email;
    if (!mail) return;
    [].forEach.call(document.querySelectorAll('[data-email]'), function (a) {
      a.textContent = mail;
      if (a.tagName === 'A') a.href = 'mailto:' + mail;
    });
  }

  /* ---------- Startseite aufbauen ---------- */
  function renderHome(d) {
    /* Hero */
    var h = d.hero || {};
    document.getElementById('site-name').textContent = d.name || 'HopeCarPcs';
    var sub = document.getElementById('hero-sub');
    sub.textContent = '';
    sub.appendChild(bi(h.subtitle_de, h.subtitle_en));
    var fr = document.getElementById('hero-frame');
    var heroImg = null;
    if (h.image) {
      heroImg = document.createElement('img');
      heroImg.src = path(h.image); heroImg.alt = '';
      heroImg.style.objectPosition = '50% ' + (h.position_y == null ? 50 : h.position_y) + '%';
      fr.appendChild(heroImg);
    }
    if (h.video && !reduce) { initHeroVideo(fr, h, heroImg); }

    /* Kunden + Events */
    renderGroup('arbeiten', d.clients);
    renderGroup('events', d.events);

    /* Reels */
    var reels = (d.reels || []).filter(function (r) { return r && r.video; });
    var rs = document.getElementById('reels');
    if (!reels.length) {
      rs.hidden = true;
      var rn = document.querySelector('nav a[href="#reels"]'); if (rn) rn.hidden = true;
    } else {
      var box = document.getElementById('reel-list');
      reels.forEach(function (r, ri) {
        var f = el('figure', 'reel-item'), w = el('button', 'reel'), v = document.createElement('video');
        w.type = 'button'; w.setAttribute('aria-label', 'Reel abspielen / Play reel');
        v.muted = true; v.setAttribute('playsinline', ''); v.tabIndex = -1;
        v.preload = r.poster ? 'none' : 'metadata';
        if (r.poster) v.poster = path(r.poster);
        v.src = path(r.video) + (r.poster ? '' : '#t=0.1');
        w.appendChild(v); w.appendChild(el('span', 'play'));
        w.addEventListener('click', function () { openReels(reels, ri, w); });
        var c = el('figcaption');
        c.appendChild(el('strong', null, r.title || ''));
        if (r.subtitle) c.appendChild(el('span', null, r.subtitle));
        f.appendChild(w); f.appendChild(c);
        box.appendChild(f);
      });
    }

    /* Über mich */
    var a = d.about || {};
    var txt = document.getElementById('about-text');
    var de = String(a.text_de || '').split(/\n\s*\n/), en = String(a.text_en || '').split(/\n\s*\n/);
    for (var i = 0; i < Math.max(de.length, en.length); i++) {
      if (!(de[i] || en[i])) continue;
      var p = el('p'); p.appendChild(bi(de[i], en[i])); txt.appendChild(p);
    }
    var ul = document.getElementById('services');
    (a.services || []).forEach(function (s) {
      var li = el('li'); li.appendChild(bi(s.de, s.en)); ul.appendChild(li);
    });

    /* Kontakt */
    var c = d.contact || {};
    var mail = document.getElementById('contact-mail');
    if (c.email) { mail.textContent = c.email; mail.href = 'mailto:' + c.email; }
    var ig = document.getElementById('contact-ig');
    if (c.instagram) {
      var handle = String(c.instagram).replace(/^@/, '');
      ig.textContent = '@' + handle; ig.href = 'https://www.instagram.com/' + handle + '/';
    } else { ig.hidden = true; }
    document.getElementById('contact-loc').textContent = c.location || '';

    /* Footer */
    document.getElementById('foot-name').textContent = '© ' + new Date().getFullYear() + ' ' + (d.name || 'HopeCarPcs');
    if (d.admin_url) {
      var ad = document.getElementById('admin-link'); ad.href = d.admin_url; ad.hidden = false;
    }

    initReveal();
    wireGalleries();
    initParallax();
  }

  function renderGroup(id, items) {
    var sec = document.getElementById(id);
    var list = (items || []).filter(function (it) { return it && (it.images || []).map(imgSrc).filter(Boolean).length; });
    if (!list.length) {
      sec.hidden = true;
      var n = document.querySelector('nav a[href="#' + id + '"]'); if (n) n.hidden = true;
      return;
    }
    list.forEach(function (it) {
      var imgs = it.images.map(imgSrc).filter(Boolean);
      var art = el('article', 'client');
      var head = el('div');
      head.appendChild(el('h3', null, it.title || ''));
      var meta = el('p', 'meta'); meta.appendChild(bi(it.meta_de, it.meta_en)); head.appendChild(meta);
      var g = el('div', 'gallery');
      var cover = el('button', 'cover'); cover.type = 'button';
      cover.setAttribute('aria-label', 'Galerie öffnen / Open gallery');
      var gal = el('div', 'gal'); gal.hidden = true;
      imgs.forEach(function (s, i) {
        var sh = el('div', 'shot');
        if (i === 0) sh.setAttribute('data-pos', it.cover_position == null ? 50 : it.cover_position);
        var im = document.createElement('img');
        im.src = path(s); im.alt = (it.title || '') + ' ' + (i + 1);
        im.loading = 'lazy'; im.decoding = 'async';
        sh.appendChild(im); gal.appendChild(sh);
      });
      g.appendChild(cover); g.appendChild(gal);
      art.appendChild(head); art.appendChild(g);
      sec.appendChild(art);
    });
  }

  /* ---------- Einblend-Animation + Parallax ---------- */
  function initReveal() {
    if (!('IntersectionObserver' in window) || reduce) return;
    root.classList.add('anim');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    [].forEach.call(document.querySelectorAll('section h2,.client,.reel-item,ul.svc li,.cols > div > p,.contact .big,.contact .links'), function (n) {
      n.classList.add('rv');
      if (n.matches('.reel-item,ul.svc li')) {
        var i = [].indexOf.call(n.parentNode.children, n);
        n.style.transitionDelay = (Math.min(i, 8) * 90) + 'ms';
      }
      io.observe(n);
    });
  }
  function initParallax() {
    var fr = document.getElementById('hero-frame');
    if (!fr || reduce) return;
    if (window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()')) return;
    if (!window.matchMedia('(hover: hover)').matches) return;
    var tick = false;
    window.addEventListener('scroll', function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () { fr.style.transform = 'translate3d(0,' + Math.min(window.scrollY, 700) * .18 + 'px,0)'; tick = false; });
    }, { passive: true });
  }

  /* ---------- Hero: Video statt Bild (optional) ---------- */
  function initHeroVideo(fr, h, img) {
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
    v.setAttribute('playsinline', ''); v.setAttribute('muted', ''); v.preload = 'auto';
    if (h.image) v.poster = path(h.image);
    v.style.objectPosition = '50% ' + (h.position_y == null ? 50 : h.position_y) + '%';
    function fit() {
      if (!v.videoWidth) return;
      var vidLand = v.videoWidth >= v.videoHeight, scrLand = window.innerWidth >= window.innerHeight;
      fr.classList.toggle('contain', vidLand !== scrLand);
    }
    v.addEventListener('loadedmetadata', fit);
    v.addEventListener('playing', function () { fr.classList.add('playing'); if (img) img.style.opacity = '0'; });
    window.addEventListener('resize', fit);
    v.src = path(h.video);
    fr.appendChild(v);
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) { var q = v.play(); if (q && q.catch) q.catch(function () {}); } else v.pause(); });
      }, { threshold: 0.05 }).observe(fr.parentNode);
    }
  }

  /* ---------- Reels: Vollbild zum Wischen ---------- */
  var rv = null, rvList = null, rvSlides = [], rvActive = -1, rvLast = null, rvMuted = false;
  function rvBuild() {
    rv = el('div', 'rw'); rv.hidden = true; rv.setAttribute('role', 'dialog'); rv.setAttribute('aria-modal', 'true');
    var x = el('button', 'rw-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Schließen / Close');
    var m = el('button', 'rw-m'); m.type = 'button'; m.setAttribute('aria-label', 'Ton / Sound');
    rvList = el('div', 'rw-list');
    rv.appendChild(rvList); rv.appendChild(m); rv.appendChild(x);
    document.body.appendChild(rv);
    x.addEventListener('click', closeReels);
    m.addEventListener('click', function () {
      rvMuted = !rvMuted; rv.classList.toggle('muted', rvMuted);
      rvSlides.forEach(function (s) { s.v.muted = rvMuted; });
    });
    document.addEventListener('keydown', function (e) {
      if (rv.hidden) return;
      if (e.key === 'Escape') closeReels();
      if (e.key === 'ArrowDown') { e.preventDefault(); rvList.scrollBy({ top: rvList.clientHeight, behavior: 'smooth' }); }
      if (e.key === 'ArrowUp') { e.preventDefault(); rvList.scrollBy({ top: -rvList.clientHeight, behavior: 'smooth' }); }
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          var i = +e.target.getAttribute('data-i');
          if (e.isIntersecting) rvPlay(i);
        });
      }, { root: rvList, threshold: 0.65 });
      rv._io = io;
    }
  }
  function rvFit(v) {
    if (!v.videoWidth) return;
    var port = v.videoHeight > v.videoWidth, scrPort = window.innerHeight > window.innerWidth;
    v.style.objectFit = (port && scrPort) ? 'cover' : 'contain';
  }
  function rvPlay(i) {
    if (i === rvActive) return;
    rvActive = i;
    rvSlides.forEach(function (s, k) {
      if (Math.abs(k - i) <= 1 && !s.v.getAttribute('src')) { s.v.src = s.src; s.v.preload = 'auto'; }
      if (k === i) { s.v.muted = rvMuted; s.v.currentTime = 0; var p = s.v.play(); if (p && p.catch) p.catch(function () { s.v.muted = true; rvMuted = true; rv.classList.add('muted'); s.v.play().catch(function () {}); }); }
      else s.v.pause();
    });
  }
  function openReels(list, i, from) {
    if (!rv) rvBuild();
    rvLast = from; rvActive = -1; rvList.innerHTML = ''; rvSlides = [];
    list.forEach(function (r, k) {
      var s = el('section', 'rw-s'); s.setAttribute('data-i', k);
      var v = document.createElement('video');
      v.loop = true; v.setAttribute('playsinline', ''); v.preload = 'none';
      if (r.poster) v.poster = path(r.poster);
      v.addEventListener('loadedmetadata', function () { rvFit(v); });
      v.addEventListener('click', function () { if (v.paused) v.play(); else v.pause(); });
      var cap = el('div', 'rw-c'); cap.appendChild(el('strong', null, r.title || ''));
      if (r.subtitle) cap.appendChild(el('span', null, r.subtitle));
      s.appendChild(v); s.appendChild(cap); rvList.appendChild(s);
      rvSlides.push({ v: v, src: path(r.video) });
      if (rv._io) rv._io.observe(s);
    });
    rv.hidden = false; rv.classList.toggle('muted', rvMuted);
    document.body.style.overflow = 'hidden';
    rvList.style.scrollBehavior = 'auto'; rvList.scrollTop = i * rvList.clientHeight;
    rvSlides[i].v.src = rvSlides[i].src;
    requestAnimationFrame(function () { rv.classList.add('open'); rvPlay(i); });
    rv.querySelector('.rw-x').focus();
  }
  function closeReels() {
    if (!rv || rv.hidden) return;
    rv.classList.remove('open');
    rvSlides.forEach(function (s) { s.v.pause(); if (rv._io) rv._io.disconnect(); });
    setTimeout(function () { rv.hidden = true; rvList.innerHTML = ''; rvSlides = []; }, 250);
    document.body.style.overflow = ''; rvActive = -1;
    if (rvLast) rvLast.focus();
  }

  /* ---------- Galerie (Vollbild, wischbar) ---------- */
  var lb = document.getElementById('lb');
  if (!lb) return;
  var stage = lb.querySelector('.lb-stage'), cnt = lb.querySelector('.lb-c');
  var items = [], idx = 0, last = null, busy = false, moved = false;
  var track = el('div', 'lb-track'); stage.appendChild(track);

  function mk(i) {
    var n = items[(i % items.length + items.length) % items.length].cloneNode(true);
    var im = n.querySelector('img'); im.draggable = false; im.loading = 'eager'; im.decoding = 'sync';
    var s = el('div', 'slide'); s.appendChild(n); return s;
  }
  function place() { [].forEach.call(track.children, function (s, k) { s.style.left = ((k - 1) * 100) + '%'; }); }
  function preload() {
    var n = items.length;
    for (var o = -2; o <= 2; o++) { var p = items[((idx + o) % n + n) % n].querySelector('img'); if (p) { var i = new Image(); i.src = p.currentSrc || p.src; } }
  }
  function render() {
    track.style.transition = 'none'; track.style.transform = 'translateX(0)'; track.innerHTML = '';
    [-1, 0, 1].forEach(function (o) { track.appendChild(mk(idx + o)); });
    place();
    cnt.textContent = (idx + 1) + ' / ' + items.length;
    preload();
  }
  function openLb(list, i, from) {
    items = list; idx = i; last = from; lb.hidden = false; resetDrag(); render();
    requestAnimationFrame(function () { lb.classList.add('open'); });
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-x').focus();
  }
  function closeLb() {
    lb.classList.remove('open');
    setTimeout(function () { if (lb.classList.contains('open')) return; lb.hidden = true; track.innerHTML = ''; resetDrag(); }, 400);
    document.body.style.overflow = '';
    if (last) last.focus();
  }
  function go(d) {
    if (busy || items.length < 2) return; busy = true;
    var n = items.length;
    if (reduce) { idx = (idx + d + n) % n; render(); busy = false; return; }
    track.style.transition = 'transform .4s cubic-bezier(.22,.8,.2,1)';
    track.style.transform = 'translateX(' + (-d * stage.clientWidth) + 'px)';
    setTimeout(function () {
      idx = (idx + d + n) % n;
      track.style.transition = 'none';
      if (d > 0) { track.removeChild(track.firstChild); track.appendChild(mk(idx + 1)); }
      else { track.removeChild(track.lastChild); track.insertBefore(mk(idx - 1), track.firstChild); }
      place(); track.style.transform = 'translateX(0)';
      cnt.textContent = (idx + 1) + ' / ' + n;
      preload(); busy = false;
    }, 410);
  }
  function snap() { track.style.transition = 'transform .3s cubic-bezier(.22,.8,.2,1)'; track.style.transform = 'translateX(0)'; }

  function wireGalleries() {
    [].forEach.call(document.querySelectorAll('.gallery'), function (g) {
      var shots = [].slice.call(g.querySelectorAll('.gal .shot')), cover = g.querySelector('.cover');
      var cl = shots[0].cloneNode(true);
      cl.querySelector('img').style.objectPosition = '50% ' + (shots[0].getAttribute('data-pos') || 50) + '%';
      cover.appendChild(cl);
      var c = el('span', 'count');
      c.innerHTML = '<span class="de">' + shots.length + ' Bilder ansehen</span><span class="en">View ' + shots.length + ' images</span>';
      cover.appendChild(c);
      cover.addEventListener('click', function () { openLb(shots, 0, cover); });
    });
  }

  lb.querySelector('.lb-x').addEventListener('click', closeLb);
  lb.querySelector('.lb-p').addEventListener('click', function () { go(-1); });
  lb.querySelector('.lb-n').addEventListener('click', function () { go(1); });
  lb.addEventListener('click', function (e) {
    if (moved) { moved = false; return; }
    if (e.target === lb || (stage.contains(e.target) && e.target.tagName !== 'IMG')) closeLb();
  });
  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });
  var sx = 0, sy = 0, st = 0, dx = 0, dy = 0, axis = '', drag = false;
  function resetDrag() { stage.style.transition = ''; stage.style.transform = ''; stage.style.opacity = ''; lb.style.background = ''; }
  function snapY() {
    stage.style.transition = 'transform .3s cubic-bezier(.22,.8,.2,1), opacity .3s';
    stage.style.transform = 'none'; stage.style.opacity = '1'; lb.style.background = '';
  }
  stage.addEventListener('pointerdown', function (e) {
    if (busy || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag = true; moved = false; axis = ''; sx = e.clientX; sy = e.clientY; st = Date.now(); dx = 0; dy = 0;
    track.style.transition = 'none'; stage.style.transition = 'none';
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  });
  stage.addEventListener('pointermove', function (e) {
    if (!drag) return; dx = e.clientX - sx; dy = e.clientY - sy;
    if (!axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
    if (axis) moved = true;
    if (axis === 'x' && items.length > 1) track.style.transform = 'translateX(' + dx + 'px)';
    if (axis === 'y') {
      var k = Math.min(1, Math.abs(dy) / 420);
      stage.style.transform = 'translateY(' + dy + 'px) scale(' + (1 - k * .12) + ')';
      stage.style.opacity = String(1 - k * .5);
      lb.style.background = 'rgba(0,0,0,' + (.95 * (1 - k * .85)) + ')';
    }
  });
  stage.addEventListener('pointerup', function () {
    if (!drag) return; drag = false;
    var dt = Math.max(1, Date.now() - st);
    if (axis === 'y') {
      var v = Math.abs(dy) / dt;
      if (Math.abs(dy) > 110 || (v > .5 && Math.abs(dy) > 30)) {
        stage.style.transition = 'transform .28s cubic-bezier(.4,0,1,1), opacity .28s';
        stage.style.transform = 'translateY(' + (dy < 0 ? -1 : 1) * window.innerHeight * .8 + 'px) scale(.85)';
        stage.style.opacity = '0'; lb.style.background = 'rgba(0,0,0,0)';
        setTimeout(closeLb, 120);
      } else snapY();
      return;
    }
    var vx = Math.abs(dx) / dt;
    if (axis === 'x' && Math.abs(dx) > 20 && (Math.abs(dx) > stage.clientWidth * .18 || vx > .45)) go(dx < 0 ? 1 : -1); else snap();
  });
  stage.addEventListener('pointercancel', function () { if (!drag) return; drag = false; if (axis === 'y') snapY(); else snap(); });
})();

(function(){
  var hd=document.querySelector('header'),b=document.getElementById('burger'),m=document.getElementById('menu');
  if(!hd||!b||!m)return;
  function set(o){hd.classList.toggle('open',o);b.setAttribute('aria-expanded',o);document.body.style.overflow=o?'hidden':''}
  b.addEventListener('click',function(){set(!hd.classList.contains('open'))});
  m.addEventListener('click',function(e){if(e.target.closest('a'))set(false)});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')set(false)});
  window.addEventListener('resize',function(){if(innerWidth>760)set(false)});
})();

(function(){
  var hd=document.querySelector('header');if(!hd)return;
  var t=false;function u(){hd.classList.toggle('scrolled',window.scrollY>40)}
  window.addEventListener('scroll',function(){if(t)return;t=true;requestAnimationFrame(function(){u();t=false})},{passive:true});u();
})();
