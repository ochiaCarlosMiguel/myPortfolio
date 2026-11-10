/* =========================================================
   hero.js — name letter animation, rotating role, stat counters,
   interactive particle network, and photo-orb parallax.
   ========================================================= */
window.CMO.module("hero", function () {
  "use strict";
  const { $, $$, root, reduceMotion, finePointer, whenReady, countUp, onResize } = window.CMO;

  /* ---------- split the name into letters, grouped per word ----------
     ".word" is nowrap so zooming can never break "Migue / l". */
  let ci = 0;
  $$("[data-split]").forEach((el) => {
    const text = el.textContent.trim();
    el.setAttribute("aria-label", text);
    el.textContent = "";
    text.split(/\s+/).forEach((w, wi) => {
      if (wi > 0) el.appendChild(document.createTextNode(" "));
      const word = document.createElement("span");
      word.className = "word";
      word.setAttribute("aria-hidden", "true");
      for (const ch of w) {
        const s = document.createElement("span");
        s.className = "char";
        s.style.setProperty("--ci", ci++);
        s.textContent = ch;
        word.appendChild(s);
      }
      el.appendChild(word);
    });
  });

  /* ---------- once the loading screen is gone ---------- */
  whenReady(() => {
    countUp($$(".stats [data-count]"));
    startRotator();
    setTimeout(() => root.classList.add("chars-done"), 2300); // letters may now react to hover
  });

  function startRotator() {
    const words = $$("#rotator span");
    if (words.length < 2 || reduceMotion) return;
    let i = 0;
    setInterval(() => {
      const cur = words[i];
      i = (i + 1) % words.length;
      cur.classList.remove("is-active");
      cur.classList.add("is-leaving");
      words[i].classList.add("is-active");
      setTimeout(() => cur.classList.remove("is-leaving"), 600);
    }, 2400);
  }

  /* ---------- particle network (pauses off-screen and in hidden tabs) ---------- */
  const canvas = $("#heroCanvas");
  const hero = $(".hero");
  if (canvas && hero && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, points = [];
    const mouse = { x: -9999, y: -9999 };
    let DOT = "196, 240, 66", LINK = "47, 213, 240";
    const readColors = () => {
      const cs = getComputedStyle(root);
      DOT = cs.getPropertyValue("--dot").trim() || DOT;
      LINK = cs.getPropertyValue("--link").trim() || LINK;
    };
    readColors();
    document.addEventListener("themechange", readColors);

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, (w * h) / 16000));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 0.6
      }));
    }

    // Runs on the shared clock only while the hero is on screen (fully stopped otherwise).
    const MAX_D = 130, MAX_D2 = MAX_D * MAX_D;
    function draw(t, dt) {
      const s = dt / 16.67;                               // same speed on 60 / 120 / 144 Hz screens
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.fillStyle = `rgba(${DOT}, .7)`;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.x += p.vx * s; p.y += p.vy * s;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        const md = Math.sqrt(mdx * mdx + mdy * mdy);
        if (md < 120 && md > 0) { p.x += (mdx / md) * 1.2 * s; p.y += (mdy / md) * 1.2 * s; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        for (let j = i + 1; j < points.length; j++) {
          const q = points[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const d2 = dx * dx + dy * dy;                   // compare squared distances (no sqrt per pair)
          if (d2 < MAX_D2) {
            ctx.strokeStyle = `rgba(${LINK},${0.2 * (1 - Math.sqrt(d2) / MAX_D)})`;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        if (md < 160) {
          ctx.strokeStyle = `rgba(${DOT},${0.35 * (1 - md / 160)})`;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }
    let stopDraw = null;
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !stopDraw) stopDraw = window.CMO.onFrame(draw);
      else if (!e.isIntersecting && stopDraw) { stopDraw(); stopDraw = null; }
    }).observe(canvas);

    resize();
    onResize(resize);
    hero.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
  }

  /* ---------- photo orb drifts with the mouse (depth parallax) ---------- */
  const visual = $(".hero__visual");
  if (hero && visual && finePointer && !reduceMotion) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      visual.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      visual.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    hero.addEventListener("pointerleave", () => {
      visual.style.setProperty("--px", 0);
      visual.style.setProperty("--py", 0);
    });
  }
});
