/* =========================================================
   motion.js — newest motion layer: context cursor labels,
   section "arrival" flash after menu navigation, and the
   desktop side dot navigation.
   (Scroll-linked effects are pure CSS in 17-motion.css.)
   ========================================================= */
window.CMO.module("motion", function () {
  "use strict";
  const { $, $$, reduceMotion, finePointer, scramble } = window.CMO;

  const sections = $$("main section[id]");

  /* ---------- 1. context cursor labels ---------- */
  const ring = $("#cursor");
  if (ring && finePointer && !reduceMotion) {
    const label = document.createElement("span");
    label.className = "cursor__label";
    ring.appendChild(label);
    // most specific first
    const rules = [
      [".bug", "Squash!"],
      [".orb__photo", "Click"],
      [".cert", "View"],
      ["a[download]", "Save"],
      [".project__link, .repo-btn, a[target='_blank']", "Open"],
      [".sim-btn", "Run"]
    ];
    document.addEventListener("pointerover", (e) => {
      let text = "";
      for (const [sel, t] of rules) { if (e.target.closest(sel)) { text = t; break; } }
      ring.classList.toggle("has-label", !!text);
      if (text) label.textContent = text;
    });
  }

  /* ---------- 2. section flash after jumping from the menu ---------- */
  function flash(id) {
    const head = $(`#${id} .section-head`);
    if (!head || reduceMotion) return;
    const eyebrow = $(".eyebrow", head);
    setTimeout(() => {
      head.classList.remove("is-flash");
      void head.offsetWidth;
      head.classList.add("is-flash");
      scramble(eyebrow); // safe to re-run: always ends on the real text
      setTimeout(() => head.classList.remove("is-flash"), 1500);
    }, 650); // after the smooth scroll lands
  }
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href^='#']");
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    if (id && document.getElementById(id)) flash(id);
  });

  /* ---------- 3. side dot navigation (desktop) ---------- */
  const names = { home: "Home", about: "About", experience: "Experience", skills: "Skills", services: "Expertise", works: "Projects", certificates: "Certificates", contact: "Contact" };
  const dots = document.createElement("nav");
  dots.className = "dots-nav";
  dots.setAttribute("aria-label", "Section progress");
  dots.innerHTML = sections.map((s) => `<a href="#${s.id}" aria-label="${names[s.id] || s.id}"><span>${names[s.id] || s.id}</span></a>`).join("");
  document.body.appendChild(dots);
  if ("IntersectionObserver" in window) {
    const dotLinks = $$("a", dots);
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        dotLinks.forEach((d) => d.classList.toggle("is-active", d.getAttribute("href") === "#" + en.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => spy.observe(s));
  }
});
