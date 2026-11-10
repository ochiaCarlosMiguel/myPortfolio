/* =========================================================
   nav.js — sticky nav state, hide-on-scroll, active-section pill,
   reading progress bar, back-to-top ring, and the mobile menu.
   ========================================================= */
window.CMO.module("nav", function () {
  "use strict";
  const { $, $$, reduceMotion, isDesktopNav, onScroll, onResize } = window.CMO;

  const nav = $("#nav");
  const links = $$("#navLinks a");
  const pill = $("#navPill");
  const toTop = $("#toTop");
  const ring = $("#toTopRing");
  const bar = $("#scrollBar");
  const RING_LEN = 2 * Math.PI * 21;
  if (ring) ring.style.strokeDasharray = RING_LEN;

  /* ---------- scroll-driven chrome ---------- */
  let lastY = window.scrollY;
  onScroll((y, max) => {
    const p = max > 0 ? y / max : 0;
    nav.classList.toggle("is-scrolled", y > 20);
    if (!document.body.classList.contains("menu-open")) nav.classList.toggle("is-hidden", y > lastY && y > 500);
    lastY = y;
    if (toTop) toTop.classList.toggle("is-visible", y > 600);
    if (ring) ring.style.strokeDashoffset = RING_LEN * (1 - p);
    if (bar) bar.style.transform = `scaleX(${p})`;
  });
  if (toTop) toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  /* ---------- active section → sliding pill ---------- */
  function movePill() {
    const active = $("#navLinks a.is-active");
    if (!pill) return;
    if (!active || !isDesktopNav()) { pill.style.opacity = "0"; return; }
    pill.style.opacity = "1";
    pill.style.width = active.offsetWidth + "px";
    pill.style.transform = `translateX(${active.offsetLeft}px)`;
  }
  if ("IntersectionObserver" in window) {
    const alias = { services: "skills" }; // sections without their own nav link
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = alias[en.target.id] || en.target.id;
        links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + id));
        movePill();
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach((s) => spy.observe(s));
  }
  onResize(movePill);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);

  /* ---------- mobile menu ---------- */
  const burger = $("#burger");
  const menu = $("#mobileMenu");
  if (!burger || !menu) return;
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
  onResize(() => { if (isDesktopNav() && menu.classList.contains("is-open")) setMenu(false); });
});
