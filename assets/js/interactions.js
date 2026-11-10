/* =========================================================
   interactions.js — pointer-driven polish: custom cursor,
   cursor glow, magnetic elements, card spotlight + 3D tilt,
   and click ripples. Mouse/trackpad only; off for reduced motion.
   ========================================================= */
window.CMO.module("interactions", function () {
  "use strict";
  const { $, $$, reduceMotion, finePointer } = window.CMO;

  // decorate surfaces first so the bindings below pick them up
  $$(".social a, .contact-item").forEach((el) => el.classList.add("magnetic"));
  $$(".tile, .project:not(.project--feature)").forEach((el) => { el.classList.add("tilt"); el.dataset.tilt = "4"; });
  $$(".cert").forEach((c) => c.classList.add("tilt"));

  /* ---------- click ripple (works on touch too) ---------- */
  if (!reduceMotion) {
    document.addEventListener("pointerdown", (e) => {
      const host = e.target.closest(".btn, .filter, .cert-filter, .details-btn, .nav__cta, .cert-link");
      if (!host) return;
      const r = host.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const s = document.createElement("span");
      s.className = "ripple";
      s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      host.appendChild(s);
      s.addEventListener("animationend", () => s.remove());
    });
  }

  if (!finePointer || reduceMotion) return;

  /* ---------- custom cursor: dot follows instantly, ring eases behind ---------- */
  const ring = $("#cursor");
  const dot = $("#cursorDot");
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, gx = x, gy = y;
  const glow = document.createElement("div");   // soft glow that trails the cursor
  glow.className = "cursor-glow";
  glow.setAttribute("aria-hidden", "true");
  document.body.appendChild(glow);

  // Ring + glow share the core animation clock and go fully idle once they catch up,
  // so a still mouse costs zero CPU. Easing is frame-rate independent (60/120/144 Hz feel the same).
  let stop = null;
  const follow = (t, dt) => {
    const k = (rate) => 1 - Math.pow(1 - rate, dt / 16.67);
    rx += (x - rx) * k(0.18); ry += (y - ry) * k(0.18);
    gx += (x - gx) * k(0.08); gy += (y - gy) * k(0.08);
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    glow.style.transform = `translate(${gx}px, ${gy}px)`;
    if (Math.abs(x - gx) + Math.abs(y - gy) < 0.3 && Math.abs(x - rx) + Math.abs(y - ry) < 0.3) { stop(); stop = null; }
  };
  addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    glow.classList.add("is-on");
    if (!stop) stop = window.CMO.onFrame(follow);
  }, { passive: true });
  document.addEventListener("pointerleave", () => glow.classList.remove("is-on"));
  document.addEventListener("pointerover", (e) => {
    ring.classList.toggle("is-hover", !!e.target.closest("a, button, .cert, [role='tab']"));
  });
  document.addEventListener("pointerleave", () => { ring.classList.add("is-hidden"); dot.classList.add("is-hidden"); });
  document.addEventListener("pointerenter", () => { ring.classList.remove("is-hidden"); dot.classList.remove("is-hidden"); });


  /* ---------- magnetic elements ---------- */
  $$(".magnetic").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transition = "transform .6s cubic-bezier(.16,1,.3,1)";
      el.style.transform = "";
      setTimeout(() => (el.style.transition = ""), 600);
    });
  });

  /* ---------- spotlight glow + 3D tilt on cards ---------- */
  $$(".spotlight").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", e.clientX - r.left + "px");
      el.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });
  $$(".tilt").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      const amp = +(el.dataset.tilt || 8);
      el.style.transform = `perspective(900px) rotateX(${-py * amp}deg) rotateY(${px * amp}deg) translateY(-6px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });
});
