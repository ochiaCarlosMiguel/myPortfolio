/* =========================================================
   components.js — reusable UI widgets: accessible tabs,
   project filters, "View Details" toggles, copy-email, year.
   ========================================================= */
window.CMO.module("components", function () {
  "use strict";
  const { $, $$, reduceMotion, toast, onResize } = window.CMO;

  /* ---------- tabs with sliding ink + arrow-key support ---------- */
  $$("[data-tabs]").forEach((wrap) => {
    const tabs = $$('[role="tab"]', wrap);
    const ink = $(".tabs__ink", wrap);
    const list = $(".tabs__list", wrap);
    const placeInk = (tab) => {
      ink.style.width = tab.offsetWidth + "px";
      ink.style.transform = `translateX(${tab.offsetLeft}px)`;
    };
    function select(tab, focus) {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        $("#" + t.getAttribute("aria-controls")).hidden = !on;
      });
      placeInk(tab);
      if (focus) tab.focus();
      list.scrollTo({ left: tab.offsetLeft - list.clientWidth / 2 + tab.offsetWidth / 2, behavior: reduceMotion ? "auto" : "smooth" });
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
    onResize(init);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(init);
  });

  /* ---------- generic filter group (used by Projects) ---------- */
  function bindFilter(buttons, items, getKey, attr, hiddenClass, step) {
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const f = btn.dataset[attr];
        buttons.forEach((b) => { const on = b === btn; b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", String(on)); });
        let n = 0;
        items.forEach((it) => {
          const show = f === "all" || getKey(it) === f;
          it.classList.remove("is-filtering-in");
          it.classList.toggle(hiddenClass, !show);
          if (show) {
            it.classList.add("is-in");
            void it.offsetWidth;
            it.style.animationDelay = n++ * step + "ms";
            it.classList.add("is-filtering-in");
          }
        });
      });
    });
  }
  window.CMO.bindFilter = bindFilter; // shared with certificates.js
  bindFilter($$(".filter"), $$(".project"), (p) => p.dataset.cat, "filter", "is-filtered-out", 80);

  /* ---------- "View Details" toggles ---------- */
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

  /* ---------- copy email ---------- */
  const copyBtn = $("#copyEmail");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const email = $("#emailText").textContent.trim();
      try { await navigator.clipboard.writeText(email); toast("Email copied ✓"); }
      catch (e) { toast(email); }
    });
  }

  /* ---------- footer year ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
});
