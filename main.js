(function () {
  'use strict';

  /* ---------------- Hulpfuncties ---------------- */
  var D = 24;                 // lengte van het verhaal in seconden
  var CHAPTER = D / 3;        // 8 seconden per hoofdstuk
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function easeOut(k) { return 1 - Math.pow(1 - k, 4); }          // benadert cubic-bezier(.23,1,.32,1)
  function easeInOut(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function $(id) { return document.getElementById(id); }

  /* ---------------- Mobiel menu ---------------- */
  var nav = $('nav');
  var menuToggle = $('menuToggle');
  function setMenu(open) {
    nav.classList.toggle('nav-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
  }
  menuToggle.addEventListener('click', function () { setMenu(!nav.classList.contains('nav-open')); });
  $('navLinks').addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // De filmische opening staat alleen op de homepage
  var stage = $('stage');
  if (stage) initStage(stage);

  function initStage(stage) {
    /* ---------------- Scène ---------------- */
    var el = {
      cam: $('cam'),
      lines: [$('line1'), $('line2'), $('line3')],
      pulses: [$('pulse1'), $('pulse2'), $('pulse3')],
      arcBlue: $('arcBlue'), arcGreen: $('arcGreen'), arrow: $('arrow'),
      doc: $('doc'), scan: $('scan'),
      hl: [$('hl1'), $('hl2'), $('hl3')],
      chips: [$('chip1'), $('chip2'), $('chip3')],
      table: $('table'), newrow: $('newrow'), check: $('check'), lineGroup: $('lineGroup'),
      echo: [$('echo1'), $('echo2'), $('echo3')]
    };

    function prepDash(node) {
      var len = node.getTotalLength();
      node.style.strokeDasharray = len;
      node.dataset.len = len;
      return len;
    }
    el.lines.forEach(prepDash);
    prepDash(el.arcBlue);
    prepDash(el.arcGreen);
    prepDash(el.check);
    function draw(node, k) { node.style.strokeDashoffset = node.dataset.len * (1 - k); }

    var C = { x: 1060, y: 360 };                      // middelpunt van de ring
    var fieldY = [-41, -1, 75];                      // velden op het bonnetje
    var chipPos = [{ x: 1400, y: 290 }, { x: 1430, y: 360 }, { x: 1400, y: 430 }];
    var rowPos = [{ x: 895, y: 776 }, { x: 1000, y: 776 }, { x: 1215, y: 776 }];

    function render(t) {
      // Camera: inzoomen (h1), tussen de lagen (h2), uitzoomen (h3)
      var s, tx;
      if (t < 8) { s = lerp(0.92, 1.05, easeInOut(seg(t, 0, 8))); tx = 0; }
      else if (t < 16) { var k2 = easeInOut(seg(t, 8, 16)); s = lerp(1.05, 1.12, k2); tx = lerp(0, -30, k2); }
      else { var k3 = easeOut(seg(t, 16, 21)); s = lerp(1.12, 0.94, k3); tx = lerp(-30, 0, k3); }
      var fade = Math.min(seg(t, 0, 0.7), 1 - seg(t, 23.2, 24));
      el.cam.setAttribute('transform', 'translate(' + C.x + ' ' + C.y + ') scale(' + s + ') translate(' + (-C.x + tx) + ' ' + (-C.y) + ')');
      // Lijnen treden terug zodra het bonnetje binnen is en komen terug voor het logo
      el.lineGroup.setAttribute('opacity', 1 - 0.7 * seg(t, 8, 9) * (1 - seg(t, 16.5, 18)));
      el.cam.setAttribute('opacity', fade);

      // Lijnen en ring tekenen zich
      el.lines.forEach(function (n, i) { draw(n, easeOut(seg(t, 0.2 + i * 0.15, 1.6 + i * 0.15))); });
      draw(el.arcBlue, easeOut(seg(t, 0.8, 2.6)));
      draw(el.arcGreen, easeOut(seg(t, 1.1, 3.2)));
      el.arrow.setAttribute('opacity', seg(t, 2.9, 3.4));

      // Pulsjes stromen over de lijnen (alleen hoofdstuk 1)
      el.pulses.forEach(function (p, i) {
        var start = 1.6 + i * 0.5, dur = 1.6;
        var local = t - start, vis = 0, x = 470;
        if (t > start && t < 7.4) {
          var k = (local % dur) / dur;
          x = lerp(470, i === 1 ? 790 : 820, k);
          vis = Math.sin(Math.PI * k) * 0.55;
        }
        p.setAttribute('x', x);
        p.setAttribute('opacity', vis);
      });

      // Bonnetje komt binnen, wordt uitgelezen en verdwijnt in de ring
      var dx, dy, ds, drot, dop;
      if (t < 1.5) { dop = 0; dx = 470; dy = C.y; ds = .85; drot = -8; }
      else if (t < 8) {
        var kd = easeOut(seg(t, 1.5, 6.2));
        dx = lerp(470, C.x, kd); dy = C.y + Math.sin(t * 1.6) * 6 * (1 - kd);
        ds = lerp(.85, 1, kd); drot = lerp(-8, 0, kd); dop = seg(t, 1.5, 2.1);
      } else if (t < 16) {
        dx = C.x; dy = C.y; ds = lerp(1, 1.12, easeOut(seg(t, 8, 9.5))); drot = 0; dop = 1;
      } else {
        var ke = easeInOut(seg(t, 16, 17.4));
        dx = C.x; dy = C.y; ds = lerp(1.12, 0.25, ke); drot = 0; dop = 1 - ke;
      }
      el.doc.setAttribute('transform', 'translate(' + dx + ' ' + dy + ') rotate(' + drot + ') scale(' + ds + ')');
      el.doc.setAttribute('opacity', dop);

      var ks = seg(t, 8.8, 11.4);
      el.scan.setAttribute('y', lerp(-110, 106, ks));
      el.scan.setAttribute('opacity', (ks > 0 && ks < 1) ? 1 : 0);
      el.hl.forEach(function (h, i) {
        var on = seg(t, 9.4 + i * 0.8, 9.9 + i * 0.8);
        h.setAttribute('opacity', on * 0.28 * (t < 16 ? 1 : 1 - seg(t, 16, 16.6)));
      });

      // Gegevens springen eruit en landen als nieuwe regel in het overzicht
      el.chips.forEach(function (c, i) {
        var out = easeOut(seg(t, 11.6 + i * 0.35, 13.2 + i * 0.35));
        var into = easeInOut(seg(t, 17.6 + i * 0.25, 19.2 + i * 0.25));
        var fromX = C.x, fromY = C.y + fieldY[i] * 1.12;
        var x = lerp(lerp(fromX, chipPos[i].x, out), rowPos[i].x, into);
        var y = lerp(lerp(fromY, chipPos[i].y, out), rowPos[i].y, into);
        var sc = lerp(lerp(.6, 1, out), .7, into);
        var op = seg(t, 11.6 + i * 0.35, 12.1 + i * 0.35) * (1 - seg(t, 19.1, 19.7));
        c.setAttribute('transform', 'translate(' + x + ' ' + y + ') scale(' + sc + ')');
        c.setAttribute('opacity', op);
      });

      var kt = easeOut(seg(t, 16.4, 17.6));
      el.table.setAttribute('opacity', kt);
      el.table.setAttribute('transform', 'translate(0 ' + lerp(16, 0, kt) + ')');
      el.newrow.setAttribute('opacity', seg(t, 19, 19.8));

      draw(el.check, easeOut(seg(t, 17, 18.5)));

      // Rustige echo rond de ring
      el.echo.forEach(function (c, i) {
        var base = [270, 360, 460][i];
        c.setAttribute('r', base + Math.sin(t * 0.8 + i) * 6);
      });
    }

    /* ---------------- Verhaalklok ---------------- */
    var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
    var chapterBtns = Array.prototype.slice.call(document.querySelectorAll('.chapter-btn'));
    var fills = chapterBtns.map(function (b) { return b.querySelector('.fill'); });
    var playBtn = $('playBtn');
    var playIcon = $('playIcon');
    var reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');

    var state = {
      t: 0, playing: false, manualPause: false,
      reduced: reducedMq.matches, motionOptIn: false,
      stageVisible: true, chapter: 0, raf: 0, last: null
    };

    function setChapter(c) {
      if (c === state.chapter) return;
      var active = document.activeElement;
      state.chapter = c;
      panels.forEach(function (p, i) {
        var on = i === c;
        p.classList.toggle('is-active', on);
        if (on) { p.removeAttribute('aria-hidden'); p.inert = false; }
        else { p.setAttribute('aria-hidden', 'true'); p.inert = true; }
      });
      chapterBtns.forEach(function (b, i) {
        if (i === c) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      if (active && panels[c] && !panels[c].contains(active) && panels.some(function (p) { return p.contains(active); })) {
        playBtn.focus({ preventScroll: true });
      }
    }

    function sync() {
      var progress = clamp(state.t / D, 0, 1);
      setChapter(Math.min(2, Math.floor(progress * 3)));
      fills.forEach(function (f, i) { f.style.transform = 'scaleX(' + clamp(progress * 3 - i, 0, 1) + ')'; });
    }

    function frame(ts) {
      if (state.last === null) state.last = ts;
      var dt = Math.min((ts - state.last) / 1000, 0.1);
      state.last = ts;
      state.t += dt;
      if (state.t >= D) state.t -= D;   // naadloze herhaling, terug naar hoofdstuk 1
      render(state.t);
      sync();
      state.raf = requestAnimationFrame(frame);
    }

    function updatePlayButton() {
      var label = state.playing ? 'Animatie pauzeren' : 'Animatie afspelen';
      playBtn.setAttribute('aria-label', label);
      playBtn.title = label;
      if (state.playing) {
        playIcon.setAttribute('d', 'M8 5v14M16 5v14');
        playIcon.setAttribute('fill', 'none');
        playIcon.setAttribute('stroke', 'currentColor');
      } else {
        playIcon.setAttribute('d', 'm8 5 11 7-11 7Z');
        playIcon.setAttribute('fill', 'currentColor');
        playIcon.setAttribute('stroke', 'none');
      }
    }

    function start() {
      if (state.playing) return;
      state.playing = true;
      state.last = null;
      state.raf = requestAnimationFrame(frame);
      updatePlayButton();
    }
    function stop() {
      state.playing = false;
      cancelAnimationFrame(state.raf);
      updatePlayButton();
    }
    function mayPlay() {
      return !state.manualPause && (!state.reduced || state.motionOptIn) && state.stageVisible && !document.hidden;
    }
    function resumeIfAllowed() { if (mayPlay()) start(); else stop(); }

    function seekChapter(i) {
      state.t = i * CHAPTER + 0.001;
      render(state.t);
      sync();
    }

    chapterBtns.forEach(function (b) {
      b.addEventListener('click', function () { seekChapter(Number(b.dataset.chapter)); });
    });
    playBtn.addEventListener('click', function () {
      if (state.playing) { state.manualPause = true; stop(); }
      else {
        state.manualPause = false;
        if (state.reduced) state.motionOptIn = true;
        start();
      }
    });

    document.addEventListener('visibilitychange', resumeIfAllowed);
    window.addEventListener('pagehide', stop);
    window.addEventListener('pageshow', resumeIfAllowed);
    reducedMq.addEventListener('change', function (e) {
      state.reduced = e.matches;
      state.motionOptIn = false;
      resumeIfAllowed();
    });

    // Animatie stopt als de opening uit beeld is gescrold (scheelt batterij)
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        state.stageVisible = entries[0].isIntersecting;
        resumeIfAllowed();
      }, { threshold: 0.05 }).observe(stage);
    }

    /* ---------------- Navigatie ---------------- */
    function onScroll() { nav.classList.toggle('solid', window.scrollY > stage.offsetHeight - 80); }
    window.addEventListener('scroll', onScroll, { passive: true });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { render(state.t); onScroll(); }, 120);
    });

    /* ---------------- Start ---------------- */
    if (state.reduced) {
      state.t = 6.6;                 // stilstaand beeld: bonnetje in de ring, eerste tekst
      render(state.t);
      sync();
      updatePlayButton();
    } else {
      render(0);
      sync();
      resumeIfAllowed();
    }
    onScroll();
  }

  /* ---------------- Contactformulier ---------------- */
  var form = $('contactForm');
  var status = $('contactStatus');
  if (form) {
    var HOOK = 'https://hook.eu1.make.com/6jqmrpbboq8z195cjt7ht1bwnf5a3uf3';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.naam.value.trim() || !form.email.value.trim() || !form.omschrijving.value.trim()) {
        status.textContent = 'Vul je naam, e-mailadres en je vraag in.';
        return;
      }
      if (!form.email.checkValidity()) {
        status.textContent = 'Controleer je e-mailadres.';
        return;
      }
      var button = form.querySelector('button');
      button.disabled = true;
      status.textContent = 'Versturen...';
      fetch(HOOK, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(new FormData(form)) })
        .then(function () {
          form.reset();
          status.textContent = 'Bedankt! We hebben je aanvraag ontvangen en nemen snel contact met je op.';
        })
        .catch(function () {
          status.textContent = 'Versturen lukte niet. Mail ons gerust op info@procesvlot.nl.';
        })
        .then(function () { button.disabled = false; });
    });
  }
})();
