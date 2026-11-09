/* =========================================================
   Carlos Miguel Ochia — Portfolio interactions
   ========================================================= */
(function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isDesktopNav = () => window.matchMedia("(min-width: 961px)").matches;

  /* ---------- Split hero name into animated letters ---------- */
  // Letters are grouped inside a no-wrap ".word" so a word can never break
  // mid-way (e.g. "Migue / l") when the page is zoomed or the screen is narrow.
  let charIndex = 0;
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
        const span = document.createElement("span");
        span.className = "char";
        span.style.setProperty("--ci", charIndex++);
        span.textContent = ch;
        word.appendChild(span);
      }
      el.appendChild(word);
    });
  });

  /* ---------- Theme switch (dark default, remembered) ---------- */
  const themeBtn = $("#themeToggle");
  const metaTheme = $('meta[name="theme-color"]');
  function syncThemeUI() {
    const light = root.getAttribute("data-theme") === "light";
    themeBtn.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
    if (metaTheme) metaTheme.setAttribute("content", light ? "#f5f7f1" : "#07090e");
  }
  function applyTheme(next) {
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("cmo-theme", next); } catch (e) { /* storage unavailable */ }
    syncThemeUI();
    document.dispatchEvent(new CustomEvent("themechange"));
  }
  syncThemeUI();
  themeBtn.addEventListener("click", (e) => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    if (reduceMotion) { applyTheme(next); return; }

    // Circular reveal from the button where supported, otherwise a smooth color fade
    if (document.startViewTransition) {
      const r = themeBtn.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const vt = document.startViewTransition(() => applyTheme(next));
      vt.ready.then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
          { duration: 700, easing: "cubic-bezier(.16,1,.3,1)", pseudoElement: "::view-transition-new(root)" }
        );
      }).catch(() => {});
    } else {
      root.classList.add("theme-anim");
      applyTheme(next);
      setTimeout(() => root.classList.remove("theme-anim"), 600);
    }
  });

  // Give pop-in chips a stagger index
  $$(".chips--pop, .health").forEach((list) => $$("li", list).forEach((li, i) => li.style.setProperty("--i", i)));

  // More interactive surfaces: social icons + contact pills become magnetic,
  // About tiles and project cards get a gentle 3D tilt (bigger cards tilt less)
  $$(".social a, .contact-item").forEach((el) => el.classList.add("magnetic"));
  $$(".tile, .project:not(.project--feature)").forEach((el) => { el.classList.add("tilt"); el.dataset.tilt = "4"; });

  // About intro: wrap each word so it can light up as the visitor scrolls
  const scrubTarget = $(".tile--story .lead");
  let scrubWords = [];
  if (scrubTarget && !reduceMotion) {
    scrubTarget.innerHTML = scrubTarget.textContent.trim().split(/\s+/).map((w) => `<span class="scrub-word">${w}</span>`).join(" ");
    scrubWords = $$(".scrub-word", scrubTarget);
  }

  /* ---------- Preloader ---------- */
  const preloader = $("#preloader");
  const loaderCount = $("#loaderCount");
  const loaderBar = $("#loaderBar");
  const loaderStatus = $("#loaderStatus");
  const statuses = ["Welcome! Getting things ready…", "Loading experience…", "Loading projects…", "Loading certificates…", "Ready ✓"];

  function startSite() {
    root.classList.add("is-ready");
    document.body.classList.remove("is-loading");
    startCounters($$(".stats [data-count]"));
    startRotator();
    // once the name has finished animating in, let letters react to hover
    setTimeout(() => root.classList.add("chars-done"), 2300);
  }

  if (reduceMotion) {
    preloader.remove();
    startSite();
  } else {
    document.body.classList.add("is-loading");
    const duration = 1500;
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(eased * 100);
      loaderCount.textContent = val;
      loaderBar.style.width = val + "%";
      loaderStatus.textContent = statuses[Math.min(statuses.length - 1, Math.floor(eased * statuses.length))];
      if (p < 1) requestAnimationFrame(tick);
      else {
        loaderStatus.textContent = statuses[statuses.length - 1];
        setTimeout(() => {
          preloader.classList.add("is-done");
          startSite();
          setTimeout(() => preloader.remove(), 1300);
        }, 250);
      }
    })(t0);
  }

  /* ---------- Rotating role words ---------- */
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

  /* ---------- Number counters ---------- */
  function startCounters(els) {
    els.forEach((el) => {
      const target = +el.dataset.count;
      const fmt = (n) => n.toLocaleString("en-US"); // 4455 → 4,455
      if (reduceMotion) { el.textContent = fmt(target); return; }
      const t0 = performance.now();
      const dur = 1400;
      (function step(now) {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = fmt(Math.round((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  /* ---------- Hero canvas: connected particle network ---------- */
  const canvas = $("#heroCanvas");
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext("2d");
    let w, h, dpr, points = [];
    const mouse = { x: -9999, y: -9999 };
    // colors come from CSS variables so the network matches the current theme
    let DOT = "196, 240, 66", LINK = "47, 213, 240";
    function readColors() {
      const cs = getComputedStyle(root);
      DOT = cs.getPropertyValue("--dot").trim() || DOT;
      LINK = cs.getPropertyValue("--link").trim() || LINK;
    }
    readColors();
    document.addEventListener("themechange", readColors);

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(90, (w * h) / 16000));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - .5) * .35,
        vy: (Math.random() - .5) * .35,
        r: Math.random() * 1.6 + .6
      }));
    }

    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);

    function draw() {
      requestAnimationFrame(draw);
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      const maxD = 130;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        // gentle push away from the mouse
        const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        const md = Math.hypot(mdx, mdy);
        if (md < 120) { p.x += (mdx / md) * 1.2; p.y += (mdy / md) * 1.2; }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + DOT + ", .7)";
        ctx.fill();

        for (let j = i + 1; j < points.length; j++) {
          const q = points[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < maxD) {
            ctx.strokeStyle = "rgba(" + LINK + "," + (0.2 * (1 - d / maxD)) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        if (md < 160) {
          ctx.strokeStyle = "rgba(" + DOT + "," + (0.35 * (1 - md / 160)) + ")";
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }

    resize();
    draw();
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    const hero = $(".hero");
    hero.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
  }

  /* ---------- Custom cursor ---------- */
  if (finePointer && !reduceMotion) {
    const ring = $("#cursor");
    const dot = $("#cursorDot");
    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    window.addEventListener("pointermove", (e) => {
      x = e.clientX; y = e.clientY;
      dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    });
    (function loop() {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener("pointerover", (e) => {
      ring.classList.toggle("is-hover", !!e.target.closest("a, button, .cert, [role='tab']"));
    });
    document.addEventListener("pointerleave", () => { ring.classList.add("is-hidden"); dot.classList.add("is-hidden"); });
    document.addEventListener("pointerenter", () => { ring.classList.remove("is-hidden"); dot.classList.remove("is-hidden"); });
  }

  /* ---------- Magnetic buttons ---------- */
  if (finePointer && !reduceMotion) {
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const mx = e.clientX - r.left - r.width / 2;
        const my = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${mx * 0.25}px, ${my * 0.35}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transition = "transform .6s cubic-bezier(.16,1,.3,1)";
        el.style.transform = "";
        setTimeout(() => (el.style.transition = ""), 600);
      });
    });
  }

  /* ---------- Spotlight + 3D tilt on cards ---------- */
  $$(".cert").forEach((c) => c.classList.add("tilt")); // certificates tilt too
  if (finePointer && !reduceMotion) {
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
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        const amp = +(el.dataset.tilt || 8);
        el.style.transform = `perspective(900px) rotateX(${-py * amp}deg) rotateY(${px * amp}deg) translateY(-6px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* ---------- Navigation: scroll state, hide on scroll, active pill ---------- */
  const nav = $("#nav");
  const navLinks = $$("#navLinks a");
  const pill = $("#navPill");
  const toTop = $("#toTop");
  const ring = $("#toTopRing");
  const RING_LEN = 2 * Math.PI * 21;
  ring.style.strokeDasharray = RING_LEN;
  let lastY = scrollY;
  let ticking = false;

  function movePill() {
    const active = $("#navLinks a.is-active");
    if (!active || !isDesktopNav()) { pill.style.opacity = "0"; return; }
    pill.style.opacity = "1";
    pill.style.width = active.offsetWidth + "px";
    pill.style.transform = `translateX(${active.offsetLeft}px)`;
  }

  const bgWords = $$(".bg-word");
  const scrollBar = $("#scrollBar");
  const exp = $(".exp");
  const marquee = $(".marquee");
  let skewLastY = scrollY, skewReset;
  function onScroll() {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle("is-scrolled", y > 20);
    if (!document.body.classList.contains("menu-open")) nav.classList.toggle("is-hidden", y > lastY && y > 500);
    lastY = y;

    toTop.classList.toggle("is-visible", y > 600);
    ring.style.strokeDashoffset = RING_LEN * (1 - (max > 0 ? y / max : 0));

    // reading-progress bar
    scrollBar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    // experience timeline line draws as the section passes the middle of the screen
    if (exp) {
      const r = exp.getBoundingClientRect();
      const p = (innerHeight * 0.6 - r.top) / r.height;
      exp.style.setProperty("--exp", Math.max(0, Math.min(1, p)).toFixed(3));
    }

    // marquee leans in the direction/speed of scrolling, then settles
    if (!reduceMotion && marquee) {
      const v = Math.max(-12, Math.min(12, (y - skewLastY) * 0.25));
      marquee.style.setProperty("--skew", (-v).toFixed(2) + "deg");
      clearTimeout(skewReset);
      skewReset = setTimeout(() => marquee.style.setProperty("--skew", "0deg"), 140);
    }
    skewLastY = y;

    // About intro words light up in reading order as the tile scrolls through view
    if (scrubWords.length) {
      const r = scrubTarget.getBoundingClientRect();
      const p = (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35);
      const lit = Math.round(Math.max(0, Math.min(1, p)) * scrubWords.length);
      scrubWords.forEach((w, i) => w.classList.toggle("on", i < lit));
    }

    // parallax on the big outline words
    if (!reduceMotion) {
      bgWords.forEach((wd) => {
        const r = wd.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        wd.style.transform = `translateX(${(r.top - innerHeight / 2) * 0.15}px)`;
      });
    }
    ticking = false;
  }
  addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();
  toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  if ("IntersectionObserver" in window) {
    const spyMap = { services: "skills" };
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = spyMap[en.target.id] || en.target.id;
        navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + id));
        movePill();
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach((s) => spy.observe(s));
  }
  addEventListener("resize", movePill);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);

  /* ---------- Mobile menu ---------- */
  const burger = $("#burger");
  const menu = $("#mobileMenu");
  function setMenu(open) {
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("menu-open", open);
    nav.classList.remove("is-hidden");
  }
  burger.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && menu.classList.contains("is-open")) setMenu(false); });
  addEventListener("resize", () => { if (isDesktopNav() && menu.classList.contains("is-open")) setMenu(false); });

  /* ---------- Reveal on scroll (+ skill bar counters) ---------- */
  const reveals = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-in"));
    startCounters($$("main .section [data-count]"));
  } else {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add("is-in");
        // count up any numbers inside the revealed block (skill bars, project stats)
        startCounters($$("[data-count]", el));
        // "decode" the small section label, like a terminal printing it
        const eb = $(".eyebrow", el);
        if (eb) scramble(eb);
        // a little celebration when the visitor reaches the contact section
        if (el.classList.contains("contact__box")) celebrate($(".contact__title", el));
        obs.unobserve(el);
        // once revealed, hand transitions back to the element (keeps hover/tilt snappy)
        setTimeout(() => { el.classList.remove("reveal"); el.style.transitionDelay = ""; }, 1300 + (parseInt(el.style.transitionDelay) || 0));
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -50px 0px" });
    reveals.forEach((el) => {
      const sibs = Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal"));
      const i = sibs.indexOf(el);
      if (i > 0) el.style.transitionDelay = Math.min(i * 80, 400) + "ms";
      obs.observe(el);
    });
  }

  /* ---------- Text scramble for section labels ---------- */
  function scramble(el) {
    if (reduceMotion || el.dataset.scrambled) return;
    el.dataset.scrambled = "1";
    const final = el.textContent;
    const glyphs = "!<>-_\\/[]{}=+*^?#01";
    const dur = 700;
    const t0 = performance.now();
    (function frame(now) {
      const p = Math.min((now - t0) / dur, 1);
      const reveal = Math.floor(p * final.length);
      let out = "";
      for (let i = 0; i < final.length; i++) {
        out += i < reveal || final[i] === " " ? final[i] : glyphs[(Math.random() * glyphs.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = final;
    })(t0);
  }

  /* ---------- Confetti burst ---------- */
  let celebrated = false;
  function celebrate(anchor) {
    if (celebrated || reduceMotion || !anchor) return;
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
      c.style.setProperty("--r", (Math.random() * 720 - 360) + "deg");
      c.style.animationDelay = (Math.random() * 0.15) + "s";
      document.body.appendChild(c);
      c.addEventListener("animationend", () => c.remove());
    }
  }

  /* ---------- Cursor glow ---------- */
  if (finePointer && !reduceMotion) {
    const glow = document.createElement("div");
    glow.className = "cursor-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);
    let gx = innerWidth / 2, gy = innerHeight / 2, tx = gx, ty = gy;
    addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; glow.classList.add("is-on"); });
    document.addEventListener("pointerleave", () => glow.classList.remove("is-on"));
    (function follow() {
      gx += (tx - gx) * 0.08; gy += (ty - gy) * 0.08;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      requestAnimationFrame(follow);
    })();
  }

  /* ---------- Photo orb parallax ---------- */
  if (finePointer && !reduceMotion) {
    const heroEl = $(".hero");
    const visual = $(".hero__visual");
    heroEl.addEventListener("pointermove", (e) => {
      const r = heroEl.getBoundingClientRect();
      visual.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      visual.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    heroEl.addEventListener("pointerleave", () => {
      visual.style.setProperty("--px", 0);
      visual.style.setProperty("--py", 0);
    });
  }

  /* ---------- Click ripple ---------- */
  if (!reduceMotion) {
    document.addEventListener("pointerdown", (e) => {
      const host = e.target.closest(".btn, .filter, .details-btn, .nav__cta, .cert-link");
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

  /* ---------- Tabs with sliding ink ---------- */
  $$("[data-tabs]").forEach((wrap) => {
    const tabs = $$('[role="tab"]', wrap);
    const ink = $(".tabs__ink", wrap);
    const list = $(".tabs__list", wrap);
    function placeInk(tab) {
      ink.style.width = tab.offsetWidth + "px";
      ink.style.transform = `translateX(${tab.offsetLeft}px)`;
    }
    function select(tab, focus) {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        $("#" + t.getAttribute("aria-controls")).hidden = !on;
      });
      placeInk(tab);
      if (focus) tab.focus();
      // keep the selected tab visible on small screens
      const l = tab.offsetLeft - list.clientWidth / 2 + tab.offsetWidth / 2;
      list.scrollTo({ left: l, behavior: reduceMotion ? "auto" : "smooth" });
    }
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t, false));
      t.addEventListener("keydown", (e) => {
        const map = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
        if (!(e.key in map)) return;
        e.preventDefault();
        select(tabs[(map[e.key] + tabs.length) % tabs.length], true);
      });
    });
    const init = () => placeInk(tabs.find((t) => t.getAttribute("aria-selected") === "true"));
    init();
    addEventListener("resize", init);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(init);
  });

  /* ---------- Project filters ---------- */
  const filters = $$(".filter");
  const projects = $$(".project");
  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      filters.forEach((b) => { const on = b === btn; b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", String(on)); });
      let n = 0;
      projects.forEach((p) => {
        const show = f === "all" || p.dataset.cat === f;
        p.classList.remove("is-filtering-in");
        p.classList.toggle("is-filtered-out", !show);
        if (show) {
          p.classList.add("is-in");
          void p.offsetWidth;
          p.style.animationDelay = (n++ * 80) + "ms";
          p.classList.add("is-filtering-in");
        }
      });
    });
  });

  /* ---------- Project details toggles ---------- */
  $$("button.details-btn").forEach((btn) => {
    const panel = btn.nextElementSibling;
    const label = $("span", btn);
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") !== "true";
      btn.setAttribute("aria-expanded", String(open));
      panel.hidden = !open;
      label.textContent = open ? "Hide Details" : "View Details";
    });
  });

  /* ---------- Certificate lightbox ---------- */
  const certs = $$(".cert");
  const lb = $("#lightbox");
  const lbImg = $("#lbImg");
  const lbCap = $("#lbCaption");
  let lbIndex = 0;
  let lastFocus = null;

  function showCert(i) {
    // step in the direction requested, skipping certificates hidden by the active filter
    const dir = i < lbIndex ? -1 : 1;
    lbIndex = (i + certs.length) % certs.length;
    let guard = 0;
    while (certs[lbIndex].classList.contains("is-hidden") && guard++ < certs.length) {
      lbIndex = (lbIndex + dir + certs.length) % certs.length;
    }
    const c = certs[lbIndex];
    const visible = certs.filter((x) => !x.classList.contains("is-hidden"));
    lbImg.style.animation = "none"; void lbImg.offsetWidth; lbImg.style.animation = "";
    lbImg.src = c.dataset.full;
    lbImg.alt = $("img", c).alt;
    lbCap.textContent = `${$("img", c).alt}  ·  ${visible.indexOf(c) + 1} / ${visible.length}`;
  }
  function openLb(i) {
    lastFocus = document.activeElement;
    showCert(i);
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    $("#lbClose").focus();
  }
  function closeLb() {
    lb.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  certs.forEach((c, i) => c.addEventListener("click", () => { lbIndex = i; openLb(i); }));

  // Certificate category filters
  const certFilters = $$(".cert-filter");
  certFilters.forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.cf;
      certFilters.forEach((b) => { const on = b === btn; b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", String(on)); });
      let n = 0;
      certs.forEach((c) => {
        const show = f === "all" || c.dataset.cat === f;
        c.classList.remove("is-filtering-in");
        c.classList.toggle("is-hidden", !show);
        if (show) {
          c.classList.add("is-in");
          void c.offsetWidth;
          c.style.animationDelay = (n++ * 70) + "ms";
          c.classList.add("is-filtering-in");
        }
      });
    });
  });
  // If a thumbnail is ever missing (e.g. the thumbs/ folder wasn't uploaded), fall back to the full image
  certs.forEach((c) => {
    const img = $("img", c);
    img.addEventListener("error", () => {
      if (img.dataset.fellBack) return;
      img.dataset.fellBack = "1";
      img.src = c.dataset.full;
    });
  });
  // "View certificate" links elsewhere on the page (e.g. the internship entry)
  $$("[data-cert-index]").forEach((b) => b.addEventListener("click", () => openLb(+b.dataset.certIndex)));
  $("#lbClose").addEventListener("click", closeLb);
  $("#lbPrev").addEventListener("click", () => showCert(lbIndex - 1));
  $("#lbNext").addEventListener("click", () => showCert(lbIndex + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLb(); });
  addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowRight") showCert(lbIndex + 1);
    if (e.key === "ArrowLeft") showCert(lbIndex - 1);
  });
  // swipe on touch screens
  let sx = null;
  lb.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) showCert(lbIndex + (dx < 0 ? 1 : -1));
    sx = null;
  });

  /* ---------- Toast + copy email ---------- */
  const toast = $("#toast");
  let tt;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(tt);
    tt = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }
  $("#copyEmail").addEventListener("click", async () => {
    const email = $("#emailText").textContent.trim();
    try { await navigator.clipboard.writeText(email); showToast("Email copied ✓"); }
    catch (e) { showToast(email); }
  });

  /* ---------- Duplicate marquee content for seamless loop ---------- */
  $$(".marquee__track").forEach((t) => { t.innerHTML += t.innerHTML; });

  /* ---------- Footer year ---------- */
  $("#year").textContent = new Date().getFullYear();
})();
