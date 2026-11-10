/* =========================================================
   core.js — shared foundation for every feature module.

   window.CMO provides:
   • CMO.module(name, init)   run a feature in isolation (one failure never breaks the rest)
   • CMO.onScroll(write, read) one scroll loop, two phases per frame:
                               all `read` fns (measure) run first, then all `write` fns (mutate)
                               → no layout thrashing while scrolling
   • CMO.onFrame(fn)          one shared animation clock (pauses when the tab is hidden)
   • CMO.onResize(fn)         debounced resize hub
   • CMO.whenReady(fn)        runs after the loading screen (or immediately if already ready)
   • helpers: $, $$, clamp, store, toast, replay, countUp, scramble, celebrate
   Load this first; every other module registers through it.
   ========================================================= */
(function () {
  "use strict";

  const root = document.documentElement;
  const matches = (q) => window.matchMedia(q).matches;

  const CMO = (window.CMO = {
    $: (s, c = document) => c.querySelector(s),
    $$: (s, c = document) => Array.from(c.querySelectorAll(s)),
    root,
    reduceMotion: matches("(prefers-reduced-motion: reduce)"),
    finePointer: matches("(hover: hover) and (pointer: fine)"),
    isDesktopNav: () => matches("(min-width: 961px)"),
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
    pageVisible: !document.hidden
  });

  /* ---------- isolated feature modules ---------- */
  CMO.modules = {};
  CMO.module = (name, init) => {
    try {
      init();
      CMO.modules[name] = "ok";
    } catch (err) {
      CMO.modules[name] = "failed";
      console.warn(`[portfolio] module "${name}" failed and was skipped:`, err);
    }
  };

  /* ---------- storage that never throws (private mode, blocked cookies) ---------- */
  CMO.store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* unavailable */ } },
    remove(k) { try { localStorage.removeItem(k); } catch (e) { /* unavailable */ } }
  };

  /* ---------- one scroll loop, measure-then-mutate ---------- */
  const reads = [], writes = [];
  let scrollQueued = false;
  function runScroll() {
    scrollQueued = false;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    for (const fn of reads) fn(y, max);   // layout reads only
    for (const fn of writes) fn(y, max);  // style writes only
  }
  CMO.onScroll = (write, read) => { if (read) reads.push(read); if (write) writes.push(write); };
  CMO.refreshScroll = runScroll;
  addEventListener("scroll", () => {
    if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(runScroll); }
  }, { passive: true });
  document.addEventListener("DOMContentLoaded", runScroll);

  /* ---------- one shared animation clock ---------- */
  const frameFns = new Set();
  let frameRunning = false, lastT = 0;
  function frame(t) {
    if (!frameFns.size || document.hidden) { frameRunning = false; return; }
    const dt = Math.min(64, t - (lastT || t));
    lastT = t;
    frameFns.forEach((fn) => fn(t, dt));
    requestAnimationFrame(frame);
  }
  function startClock() {
    if (frameRunning || document.hidden || !frameFns.size) return;
    frameRunning = true;
    lastT = 0;
    requestAnimationFrame(frame);
  }
  CMO.onFrame = (fn) => { frameFns.add(fn); startClock(); return () => frameFns.delete(fn); };

  /* ---------- debounced resize hub ---------- */
  const resizeFns = [];
  let resizeTimer;
  CMO.onResize = (fn) => resizeFns.push(fn);
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resizeFns.forEach((fn) => fn()); runScroll(); }, 120);
  });

  /* ---------- page lifecycle ---------- */
  const readyFns = [];
  CMO.isReady = false;
  CMO.whenReady = (fn) => (CMO.isReady ? fn() : readyFns.push(fn));
  CMO.setReady = () => {
    if (CMO.isReady) return;
    CMO.isReady = true;
    root.classList.add("is-ready");
    document.body.classList.remove("is-loading");
    readyFns.splice(0).forEach((fn) => fn());
  };

  /* ---------- pause everything while the tab is hidden ---------- */
  document.addEventListener("visibilitychange", () => {
    CMO.pageVisible = !document.hidden;
    if (CMO.pageVisible) startClock();
  });

  /* ---------- shared small effects ---------- */
  let toastTimer;
  CMO.toast = (msg, ms = 2400) => {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("is-visible"), ms);
  };

  CMO.replay = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  CMO.countUp = (els, dur = 1400) => {
    els.forEach((el) => {
      const target = +el.dataset.count;
      const fmt = (n) => n.toLocaleString("en-US");
      if (CMO.reduceMotion) { el.textContent = fmt(target); return; }
      const t0 = performance.now();
      (function step(now) {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = fmt(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  };

  /* "Decode" text like a terminal printing it.
     The real text is captured ONCE (data-text) and every run always ends on it;
     a newer run cancels any older one still in flight — so the label can never
     get stuck half-scrambled (e.g. "03 — [?-*>#"). */
  CMO.scramble = (el) => {
    if (!el) return;
    if (el.dataset.text === undefined) el.dataset.text = el.textContent;
    const final = el.dataset.text;
    if (CMO.reduceMotion) { el.textContent = final; return; }
    const runId = (+el.dataset.run || 0) + 1;
    el.dataset.run = runId;
    const glyphs = "!<>-_\\/[]{}=+*^?#01";
    const t0 = performance.now();
    (function frameFn(now) {
      if (+el.dataset.run !== runId) return;            // superseded by a newer run
      const p = Math.min((now - t0) / 700, 1);
      const shown = Math.floor(p * final.length);
      let out = "";
      for (let i = 0; i < final.length; i++) {
        out += i < shown || final[i] === " " ? final[i] : glyphs[(Math.random() * glyphs.length) | 0];
      }
      el.textContent = p < 1 ? out : final;
      if (p < 1) requestAnimationFrame(frameFn);
    })(t0);
  };

  let celebrated = false;
  CMO.celebrate = (anchor) => {
    if (celebrated || CMO.reduceMotion || !anchor) return;
    celebrated = true;
    const r = anchor.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const colors = ["#c4f042", "#2fd5f0", "#7fe68f", "#ffffff", "#f59e0b"];
    for (let i = 0; i < 46; i++) {
      const c = document.createElement("span");
      c.className = "confetti";
      const ang = Math.random() * Math.PI * 2;
      const dist = 140 + Math.random() * 260;
      c.style.left = cx + "px";
      c.style.top = cy + "px";
      c.style.background = colors[i % colors.length];
      c.style.setProperty("--dx", Math.cos(ang) * dist + "px");
      c.style.setProperty("--dy", Math.sin(ang) * dist + 120 + "px");
      c.style.setProperty("--r", Math.random() * 720 - 360 + "deg");
      c.style.animationDelay = Math.random() * 0.15 + "s";
      document.body.appendChild(c);
      c.addEventListener("animationend", () => c.remove());
    }
  };
})();
