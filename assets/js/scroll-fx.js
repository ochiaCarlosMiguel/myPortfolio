/* =========================================================
   scroll-fx.js — reveal-on-scroll, staggered chips, About text
   lighting up word by word, Experience timeline line, marquee
   lean, and background-word parallax.
   ========================================================= */
window.CMO.module("scroll-fx", function () {
  "use strict";
  const { $, $$, reduceMotion, clamp, onScroll, countUp, scramble, celebrate } = window.CMO;

  // stagger index for chips that pop in
  $$(".chips--pop, .health").forEach((list) => $$("li", list).forEach((li, i) => li.style.setProperty("--i", i)));

  // seamless marquee loop (content duplicated once)
  $$(".marquee__track").forEach((t) => { t.innerHTML += t.innerHTML; });

  /* ---------- reveal on scroll ---------- */
  const reveals = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-in"));
    countUp($$("main .section [data-count]"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add("is-in");
        countUp($$("[data-count]", el));                 // skill bars, project stats
        const eyebrow = $(".eyebrow", el);
        if (eyebrow) scramble(eyebrow);                   // section label "decodes"
        if (el.classList.contains("contact__box")) celebrate($(".contact__title", el));
        io.unobserve(el);
        // hand transitions back to the element so hover/tilt stay snappy
        const delay = parseInt(el.style.transitionDelay) || 0;
        setTimeout(() => { el.classList.remove("reveal"); el.style.transitionDelay = ""; }, 1300 + delay);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -50px 0px" });
    reveals.forEach((el) => {
      const sibs = Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal"));
      const i = sibs.indexOf(el);
      if (i > 0) el.style.transitionDelay = Math.min(i * 80, 400) + "ms";
      io.observe(el);
    });
  }

  /* ---------- About intro lights up word by word ---------- */
  const scrubTarget = $(".tile--story .lead");
  let scrubWords = [];
  if (scrubTarget && !reduceMotion) {
    scrubTarget.innerHTML = scrubTarget.textContent.trim().split(/\s+/)
      .map((w) => `<span class="scrub-word">${w}</span>`).join(" ");
    scrubWords = $$(".scrub-word", scrubTarget);
  }

  const exp = $(".exp");
  const marquee = $(".marquee");
  const bgWords = $$(".bg-word");
  let skewLastY = window.scrollY, skewReset;

  // Measure phase (layout reads only) → results kept here → mutate phase (style writes only).
  // Keeping reads and writes apart avoids forced re-layouts while scrolling.
  const m = { vh: 0, exp: null, scrub: null, bg: [] };
  let litWords = -1;

  onScroll(
    /* write */ (y) => {
      if (m.exp) exp.style.setProperty("--exp", clamp((m.vh * 0.6 - m.exp.top) / m.exp.height, 0, 1).toFixed(3));

      if (m.scrub) {
        const lit = Math.round(clamp((m.vh * 0.85 - m.scrub.top) / (m.scrub.height + m.vh * 0.35), 0, 1) * scrubWords.length);
        if (lit !== litWords) {               // only touch the DOM when the count changes
          litWords = lit;
          scrubWords.forEach((w, i) => w.classList.toggle("on", i < lit));
        }
      }

      if (reduceMotion) return;

      if (marquee) {
        const v = clamp((y - skewLastY) * 0.25, -12, 12);
        marquee.style.setProperty("--skew", (-v).toFixed(2) + "deg");
        clearTimeout(skewReset);
        skewReset = setTimeout(() => marquee.style.setProperty("--skew", "0deg"), 140);
      }
      skewLastY = y;

      m.bg.forEach(([wd, top]) => { wd.style.transform = `translateX(${(top - m.vh / 2) * 0.15}px)`; });
    },
    /* read */ () => {
      m.vh = window.innerHeight;
      m.exp = exp ? exp.getBoundingClientRect() : null;
      m.scrub = scrubWords.length ? scrubTarget.getBoundingClientRect() : null;
      m.bg = reduceMotion ? [] : bgWords
        .map((wd) => [wd, wd.parentElement.getBoundingClientRect()])
        .filter(([, r]) => r.bottom >= 0 && r.top <= m.vh)
        .map(([wd, r]) => [wd, r.top]);
    }
  );
});
