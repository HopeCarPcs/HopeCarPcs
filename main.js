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
      if (document.getElementById('arbeiten')) { renderHome(d); }
    })
    .catch(function () {
      var m = document.querySelector('main');
      if (m && document.getElementById('arbeiten')) {
        m.appendChild(el('p', 'msg', 'Die Inhalte konnten nicht geladen werden. Bitte Seite neu laden.'));
      }
    });

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
    document.getElementById('logo').textContent = d.name || 'HopeCarPcs';
    var sub = document.getElementById('hero-sub');
    sub.textContent = '';
    sub.appendChild(bi(h.subtitle_de, h.subtitle_en));
    if (h.image) {
      var fr = document.getElementById('hero-frame');
      var im = document.createElement('img');
      im.src = path(h.image); im.alt = '';
      im.style.objectPosition = '50% ' + (h.position_y == null ? 50 : h.position_y) + '%';
      fr.appendChild(im);
    }

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
      reels.forEach(function (r) {
        var f = el('figure', 'reel-item'), w = el('div', 'reel'), v = document.createElement('video');
        v.controls = true; v.setAttribute('playsinline', '');
        v.preload = r.poster ? 'none' : 'metadata';
        if (r.poster) v.poster = path(r.poster);
        v.src = path(r.video);
        w.appendChild(v);
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
    var tick = false;
    window.addEventListener('scroll', function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () { fr.style.transform = 'translateY(' + Math.min(window.scrollY, 900) * .2 + 'px)'; tick = false; });
    }, { passive: true });
  }

  /* ---------- Galerie (Vollbild, wischbar) ---------- */
  var lb = document.getElementById('lb');
  if (!lb) return;
  var stage = lb.querySelector('.lb-stage'), cnt = lb.querySelector('.lb-c');
  var items = [], idx = 0, last = null, busy = false, moved = false;
  var track = el('div', 'lb-track'); stage.appendChild(track);

  function mk(i) {
    var n = items[(i % items.length + items.length) % items.length].cloneNode(true);
    var im = n.querySelector('img'); im.draggable = false; im.loading = 'eager';
    var s = el('div', 'slide'); s.appendChild(n); return s;
  }
  function render() {
    track.style.transition = 'none'; track.style.transform = 'translateX(0)'; track.innerHTML = '';
    [-1, 0, 1].forEach(function (o) { var s = mk(idx + o); s.style.left = (o * 100) + '%'; track.appendChild(s); });
    cnt.textContent = (idx + 1) + ' / ' + items.length;
  }
  function openLb(list, i, from) {
    items = list; idx = i; last = from; lb.hidden = false; render();
    requestAnimationFrame(function () { lb.classList.add('open'); });
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-x').focus();
  }
  function closeLb() {
    lb.classList.remove('open');
    setTimeout(function () { lb.hidden = true; track.innerHTML = ''; }, 250);
    document.body.style.overflow = '';
    if (last) last.focus();
  }
  function go(d) {
    if (busy || items.length < 2) return; busy = true;
    var n = items.length;
    if (reduce) { idx = (idx + d + n) % n; render(); busy = false; return; }
    track.style.transition = 'transform .4s cubic-bezier(.22,.8,.2,1)';
    track.style.transform = 'translateX(' + (-d * stage.clientWidth) + 'px)';
    setTimeout(function () { idx = (idx + d + n) % n; render(); busy = false; }, 410);
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
  var sx = 0, st = 0, dx = 0, drag = false;
  stage.addEventListener('pointerdown', function (e) {
    if (busy || items.length < 2 || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag = true; moved = false; sx = e.clientX; st = Date.now(); dx = 0; track.style.transition = 'none';
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  });
  stage.addEventListener('pointermove', function (e) {
    if (!drag) return; dx = e.clientX - sx; if (Math.abs(dx) > 6) moved = true;
    track.style.transform = 'translateX(' + dx + 'px)';
  });
  stage.addEventListener('pointerup', function () {
    if (!drag) return; drag = false;
    var v = Math.abs(dx) / Math.max(1, Date.now() - st);
    if (Math.abs(dx) > 20 && (Math.abs(dx) > stage.clientWidth * .18 || v > .45)) go(dx < 0 ? 1 : -1); else snap();
  });
  stage.addEventListener('pointercancel', function () { drag = false; snap(); });
})();
