/* =========================================================
   PLAYFUL LAYER — interactive extras on top of main.js.
   To revert: remove the playful.css <link> and this <script>
   from index.html (or restore _backup-before-playful/).
   ========================================================= */
(function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const COLORS = ["#c4f042", "#2fd5f0", "#7fe68f", "#ffffff", "#f59e0b"];

  /* ---------- helpers ---------- */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg, ms = 2600) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), ms);
  }

  function burst(x, y, n = 14, spread = 70) {
    if (reduceMotion) return;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      p.className = "burst";
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      const d = spread * (0.5 + Math.random() * 0.8);
      p.style.left = x - 4 + "px";
      p.style.top = y - 4 + "px";
      p.style.background = COLORS[i % COLORS.length];
      p.style.setProperty("--dx", Math.cos(a) * d + "px");
      p.style.setProperty("--dy", Math.sin(a) * d + "px");
      document.body.appendChild(p);
      p.addEventListener("animationend", () => p.remove());
    }
  }

  function bigConfetti() {
    if (reduceMotion) return;
    for (let i = 0; i < 90; i++) {
      const c = document.createElement("span");
      c.className = "confetti";
      c.style.left = Math.random() * innerWidth + "px";
      c.style.top = "-20px";
      c.style.background = COLORS[i % COLORS.length];
      c.style.setProperty("--dx", (Math.random() - 0.5) * 300 + "px");
      c.style.setProperty("--dy", innerHeight * (0.7 + Math.random() * 0.5) + "px");
      c.style.setProperty("--r", Math.random() * 900 - 450 + "deg");
      c.style.animationDuration = 1.6 + Math.random() * 1.2 + "s";
      c.style.animationDelay = Math.random() * 0.4 + "s";
      document.body.appendChild(c);
      c.addEventListener("animationend", () => c.remove());
    }
  }

  function floatTick(x, y, text = "✓") {
    const t = document.createElement("span");
    t.className = "float-tick";
    t.textContent = text;
    t.style.left = x + "px";
    t.style.top = y - 10 + "px";
    document.body.appendChild(t);
    t.addEventListener("animationend", () => t.remove());
  }

  function replay(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  /* =========================================================
     1. BUG HUNT — 5 bugs hidden around the page
     ========================================================= */
  const BUG_SVG = `
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <g stroke="#1b1b1b" stroke-width="2" stroke-linecap="round">
        <line class="leg" x1="11" y1="17" x2="4" y2="13"/><line class="leg" x1="10" y1="22" x2="3" y2="22"/><line class="leg" x1="11" y1="27" x2="4" y2="31"/>
        <line class="leg" x1="29" y1="17" x2="36" y2="13"/><line class="leg" x1="30" y1="22" x2="37" y2="22"/><line class="leg" x1="29" y1="27" x2="36" y2="31"/>
        <line x1="17" y1="8" x2="13" y2="3"/><line x1="23" y1="8" x2="27" y2="3"/>
      </g>
      <circle cx="20" cy="10" r="5" fill="#1b1b1b"/>
      <ellipse cx="20" cy="23" rx="11" ry="12" fill="#ff5a5f"/>
      <line x1="20" y1="11" x2="20" y2="35" stroke="#1b1b1b" stroke-width="1.6"/>
      <circle cx="15" cy="19" r="2.4" fill="#1b1b1b"/><circle cx="25" cy="19" r="2.4" fill="#1b1b1b"/>
      <circle cx="14.5" cy="27" r="2" fill="#1b1b1b"/><circle cx="25.5" cy="27" r="2" fill="#1b1b1b"/>
      <circle cx="18" cy="9" r="1.1" fill="#fff"/><circle cx="22" cy="9" r="1.1" fill="#fff"/>
    </svg>`;

  // where each bug hides: [host selector, inline position, crawl speed, label]
  const BUG_SPOTS = [
    ["#about .section-head", "right:4%; top:18px", "8s", "UI alignment bug"],
    ["#experience .exp", "right:-6px; top:42%", "10s", "Flaky test"],
    ["#skills .proficiency", "right:18px; top:-16px", "7s", "Locator not found"],
    ["#works .filters", "right:0; top:-6px", "9s", "Off-by-one error"],
    ["#certificates .section-head", "right:6%; top:26px", "11s", "Broken image"]
  ];
  const TOTAL_BUGS = BUG_SPOTS.length;
  let found = 0;

  BUG_SPOTS.forEach(([sel, pos, speed, label], i) => {
    const host = $(sel);
    if (!host) return;
    // only add positioning if the host has none (keeps e.g. the sticky Proficiency card sticky)
    if (getComputedStyle(host).position === "static") host.classList.add("bug-host");
    const b = document.createElement("button");
    b.type = "button";
    b.className = "bug";
    b.setAttribute("aria-label", `Squash bug: ${label}`);
    b.style.cssText = `${pos}; --crawl:${speed}; --delay:-${i * 1.7}s`;
    b.innerHTML = BUG_SVG;
    b.addEventListener("click", (e) => squash(b, host, label, e));
    host.appendChild(b);
  });

  function squash(bug, host, label, e) {
    if (bug.classList.contains("is-squashed")) return;
    bug.classList.add("is-squashed");
    const r = bug.getBoundingClientRect();
    const hr = host.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 16, 80);

    // leave a little "FIXED" stamp where the bug was
    const stamp = document.createElement("span");
    stamp.className = "bug-fixed";
    stamp.textContent = "✓ FIXED";
    stamp.style.left = r.left - hr.left - 8 + "px";
    stamp.style.top = r.top - hr.top + 8 + "px";
    host.appendChild(stamp);
    setTimeout(() => bug.remove(), 600);

    found++;
    updateHud(true);
    if (found < TOTAL_BUGS) {
      toast(`🐞 ${label} — fixed! (${found}/${TOTAL_BUGS})`);
    } else {
      toast("🏆 All 5 bugs squashed! You've got real QA instincts.", 4200);
      bigConfetti();
    }
  }

  /* =========================================================
     2. HUD — bug counter + sections explored
     ========================================================= */
  const sections = $$("main section[id]");
  const visited = new Set();
  const hud = document.createElement("div");
  hud.className = "hud";
  hud.innerHTML = `
    <div class="hud__tip" id="hudTip" hidden>
      Psst… <strong>${TOTAL_BUGS} bugs</strong> are hiding on this page. 🐞 Can you find and squash them all?
    </div>
    <button class="hud__pill" id="hudPill" type="button" aria-describedby="hudTip" aria-label="Bug hunt progress">
      <span class="hud__stat">🐞 <b id="hudBugs">0/${TOTAL_BUGS}</b></span>
      <span class="hud__sep" aria-hidden="true"></span>
      <span class="hud__stat">🧭 <b id="hudSecs">0/${sections.length}</b></span>
      <span class="hud__bar" aria-hidden="true"><span id="hudBar"></span></span>
    </button>`;
  document.body.appendChild(hud);
  const hudPill = $("#hudPill"), hudTip = $("#hudTip");

  function updateHud(bump) {
    $("#hudBugs").textContent = `${found}/${TOTAL_BUGS}`;
    $("#hudSecs").textContent = `${visited.size}/${sections.length}`;
    const pct = ((found / TOTAL_BUGS) * 0.5 + (visited.size / sections.length) * 0.5) * 100;
    $("#hudBar").style.width = pct + "%";
    if (bump) replay(hudPill, "is-bump");
  }

  let tipTimer;
  function showTip(ms = 6000) {
    hudTip.hidden = false;
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => (hudTip.hidden = true), ms);
  }
  hudPill.addEventListener("click", () => {
    if (!hudTip.hidden) { hudTip.hidden = true; return; }
    hudTip.innerHTML = found === TOTAL_BUGS
      ? `🏆 <strong>All bugs fixed!</strong> You explored ${visited.size} of ${sections.length} sections.`
      : `🐞 <strong>${TOTAL_BUGS - found} bug${TOTAL_BUGS - found === 1 ? "" : "s"} left</strong> — look around the sections. 🧭 Explored ${visited.size}/${sections.length}.`;
    showTip(5000);
  });

  // tuck the HUD away while the footer is on screen so it never covers footer content
  const footerEl = $(".footer");
  if (footerEl && "IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => {
      hud.classList.toggle("is-away", en.isIntersecting);
      if (en.isIntersecting) hudTip.hidden = true;
    }, { threshold: 0.05 }).observe(footerEl);
  }

  // show the HUD + intro tip once the loading screen is gone
  const waitReady = setInterval(() => {
    if (!root.classList.contains("is-ready")) return;
    clearInterval(waitReady);
    setTimeout(() => { hud.classList.add("is-shown"); showTip(); }, 1800);
  }, 200);

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting || visited.has(en.target.id)) return;
        visited.add(en.target.id);
        updateHud(true);
        if (visited.size === sections.length) toast("🧭 You explored every section — thanks for visiting!");
      });
    }, { threshold: 0.25 });
    sections.forEach((s) => io.observe(s));
  }

  /* =========================================================
     3. PHOTO — click for fun facts
     ========================================================= */
  const orb = $(".orb");
  const photo = $(".orb__photo");
  const FACTS = [
    "Hi! I'm Carlos 👋 I find bugs before your users do.",
    "95+ automated scripts run every single day ⚙️",
    "700+ test cases automated (and counting) 🤖",
    "4,455 locators kept healthy 🎯",
    "Started as an AHQ intern — now a QA Engineer 🚀",
    "Dean's Lister at Bulacan State University 🎓",
    "Critical bug? Same-day fix, that's the goal ⚡"
  ];
  let factIdx = 0, bubble = null, bubbleTimer;
  if (orb && photo) {
    const hint = document.createElement("span");
    hint.className = "orb__hint";
    hint.textContent = "click me!";
    orb.appendChild(hint);
    photo.setAttribute("role", "button");
    photo.setAttribute("tabindex", "0");
    photo.setAttribute("aria-label", "Show a fun fact about Carlos");

    const showFact = () => {
      hint.remove();
      replay(orb, "is-spinning");
      if (bubble) bubble.remove();
      bubble = document.createElement("div");
      bubble.className = "fact-bubble";
      bubble.setAttribute("role", "status");
      bubble.textContent = FACTS[factIdx++ % FACTS.length];
      orb.appendChild(bubble);
      const r = photo.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 18, 140);
      clearTimeout(bubbleTimer);
      bubbleTimer = setTimeout(() => {
        if (!bubble) return;
        bubble.classList.add("is-out");
        const b = bubble; bubble = null;
        setTimeout(() => b.remove(), 400);
      }, 3600);
    };
    photo.addEventListener("click", showFact);
    photo.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); showFact(); } });
  }

  /* =========================================================
     4. HERO — click empty space for a burst; wave says hi
     ========================================================= */
  const hero = $(".hero");
  if (hero) {
    hero.addEventListener("pointerdown", (e) => {
      if (e.target.closest("a, button, .orb, .stats")) return;
      burst(e.clientX, e.clientY, 12, 60);
    });
  }
  const wave = $(".wave");
  if (wave) wave.addEventListener("click", (e) => { replay(wave, "is-hi"); burst(e.clientX, e.clientY, 10, 50); });

  /* =========================================================
     5. CURSOR SPARKLE TRAIL (mouse only, throttled)
     ========================================================= */
  if (finePointer && !reduceMotion) {
    let last = 0, lx = 0, ly = 0;
    addEventListener("pointermove", (e) => {
      const now = performance.now();
      const dist = Math.hypot(e.clientX - lx, e.clientY - ly);
      if (now - last < 35 || dist < 14) return;
      last = now; lx = e.clientX; ly = e.clientY;
      const s = document.createElement("span");
      s.className = "spark";
      s.style.left = e.clientX - 3 + "px";
      s.style.top = e.clientY - 3 + "px";
      document.body.appendChild(s);
      s.addEventListener("animationend", () => s.remove());
    }, { passive: true });
  }

  /* =========================================================
     6. CHIPS & HEALTH ITEMS — pop with a checkmark
     ========================================================= */
  document.addEventListener("click", (e) => {
    const chip = e.target.closest(".chips li, .health li, .focus-list li");
    if (!chip) return;
    replay(chip, "is-popped");
    floatTick(e.clientX, e.clientY, "✓");
  });

  /* =========================================================
     7. STATS — click to recount
     ========================================================= */
  $$(".stat").forEach((stat) => {
    stat.addEventListener("click", () => {
      const num = $("[data-count]", stat);
      replay(stat, "is-bounce");
      if (!num || reduceMotion) return;
      const target = +num.dataset.count;
      const t0 = performance.now();
      (function step(now) {
        const p = Math.min((now - t0) / 700, 1);
        num.textContent = Math.round(p * target).toLocaleString("en-US");
        if (p < 1) requestAnimationFrame(step);
      })(t0);
      const r = stat.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, 10, 60);
    });
  });

  /* =========================================================
     8. P0 ESCALATION SIMULATOR
     ========================================================= */
  const escalation = $(".escalation");
  const flow = escalation && $(".flow", escalation);
  if (escalation && flow) {
    const label = $(".feature__label", escalation);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sim-btn";
    btn.innerHTML = '<i class="fas fa-play"></i> Simulate';
    label.appendChild(btn);
    const status = document.createElement("p");
    status.className = "sim-status";
    status.setAttribute("aria-live", "polite");
    escalation.appendChild(status);

    const steps = $$("li", flow);
    const lines = [
      "🔍 Daily run flagged a client-impacting failure…",
      "🚨 Escalated as a critical (P0) defect",
      "🛠️ Dev on it — fix + ETA: today",
      "🚀 DevOps deploying the hotfix…",
      "✅ Verified — client unaffected. Case closed!"
    ];
    const center = (li) => {
      const ic = $(".flow__icon", li).getBoundingClientRect();
      const fr = flow.getBoundingClientRect();
      return { x: ic.left - fr.left + ic.width / 2, y: ic.top - fr.top + ic.height / 2 };
    };

    btn.addEventListener("click", () => {
      btn.disabled = true;
      steps.forEach((s) => s.classList.remove("is-active", "is-done"));
      const runner = document.createElement("span");
      runner.className = "sim-runner";
      runner.textContent = "🐞";
      flow.appendChild(runner);
      let i = 0;
      const place = () => { const c = center(steps[i]); runner.style.left = c.x + "px"; runner.style.top = c.y + "px"; };
      place();
      const tick = () => {
        steps.forEach((s, k) => { s.classList.toggle("is-active", k === i); s.classList.toggle("is-done", k < i); });
        place();
        status.textContent = lines[i];
        if (i === steps.length - 1) {
          runner.textContent = "✓";
          runner.classList.add("is-fixed");
          const r = runner.getBoundingClientRect();
          setTimeout(() => burst(r.left + 15, r.top + 15, 20, 90), 500);
          setTimeout(() => {
            runner.remove();
            steps.forEach((s) => s.classList.remove("is-active", "is-done"));
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-rotate-right"></i> Replay';
          }, 2600);
          return;
        }
        i++;
        setTimeout(tick, reduceMotion ? 300 : 1100);
      };
      setTimeout(tick, 150);
    });
  }

  /* =========================================================
     9. HOLOGRAPHIC CERTIFICATES — shine follows the mouse
     ========================================================= */
  if (finePointer) {
    $$(".cert").forEach((c) => {
      c.addEventListener("pointermove", (e) => {
        const r = c.getBoundingClientRect();
        c.style.setProperty("--hx", ((e.clientX - r.left) / r.width) * 100 + "%");
        c.style.setProperty("--hy", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
    });
  }

  /* =========================================================
     10. ROCKET BACK-TO-TOP
     ========================================================= */
  const toTop = $("#toTop");
  if (toTop && !reduceMotion) {
    toTop.addEventListener("click", () => {
      toTop.classList.add("is-launching");
      for (let k = 0; k < 6; k++) {
        const s = document.createElement("span");
        s.className = "smoke";
        s.style.setProperty("--sx", (Math.random() - 0.5) * 30 + "px");
        s.style.animationDelay = k * 60 + "ms";
        toTop.appendChild(s);
        s.addEventListener("animationend", () => s.remove());
      }
      setTimeout(() => toTop.classList.remove("is-launching"), 1200);
    });
  }
})();
