/* =========================================================
   theme.js — dark/light switch (dark is the default).
   The saved choice is applied before first paint by the
   inline script in <head>; this module handles the toggle.
   ========================================================= */
window.CMO.module("theme", function () {
  "use strict";
  const { $, root, reduceMotion, store } = window.CMO;

  const btn = $("#themeToggle");
  const metaTheme = $('meta[name="theme-color"]');
  if (!btn) return;

  function syncUI() {
    const light = root.getAttribute("data-theme") === "light";
    btn.setAttribute("aria-label", light ? "Switch to dark mode" : "Switch to light mode");
    if (metaTheme) metaTheme.setAttribute("content", light ? "#f4f6fa" : "#07090e");
  }

  function apply(next) {
    root.setAttribute("data-theme", next);
    store.set("cmo-theme", next);
    syncUI();
    document.dispatchEvent(new CustomEvent("themechange"));
  }

  syncUI();
  btn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    if (reduceMotion) { apply(next); return; }

    // circular reveal from the button (View Transitions), otherwise a color fade
    if (document.startViewTransition) {
      const r = btn.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const vt = document.startViewTransition(() => apply(next));
      vt.ready.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
          { duration: 700, easing: "cubic-bezier(.16,1,.3,1)", pseudoElement: "::view-transition-new(root)" }
        );
      }).catch(() => {});
    } else {
      root.classList.add("theme-anim");
      apply(next);
      setTimeout(() => root.classList.remove("theme-anim"), 600);
    }
  });
});
