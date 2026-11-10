/* =========================================================
   certificates.js — category filters + full-size viewer
   (keyboard, swipe, respects the active filter, falls back to
   the full image if a thumbnail is missing).
   ========================================================= */
window.CMO.module("certificates", function () {
  "use strict";
  const { $, $$, bindFilter } = window.CMO;

  const certs = $$(".cert");
  const lb = $("#lightbox");
  if (!certs.length || !lb) return;
  const lbImg = $("#lbImg");
  const lbCap = $("#lbCaption");
  let index = 0;
  let lastFocus = null;

  bindFilter($$(".cert-filter"), certs, (c) => c.dataset.cat, "cf", "is-hidden", 70);

  function show(i) {
    // step in the requested direction, skipping certificates hidden by the filter
    const dir = i < index ? -1 : 1;
    index = (i + certs.length) % certs.length;
    let guard = 0;
    while (certs[index].classList.contains("is-hidden") && guard++ < certs.length) {
      index = (index + dir + certs.length) % certs.length;
    }
    const c = certs[index];
    const visible = certs.filter((x) => !x.classList.contains("is-hidden"));
    const alt = $("img", c).alt;
    lbImg.style.animation = "none"; void lbImg.offsetWidth; lbImg.style.animation = "";
    lbImg.src = c.dataset.full;
    lbImg.alt = alt;
    lbCap.textContent = `${alt}  ·  ${visible.indexOf(c) + 1} / ${visible.length}`;
  }
  function open(i) {
    lastFocus = document.activeElement;
    index = i;
    show(i);
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    $("#lbClose").focus();
  }
  function close() {
    lb.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  certs.forEach((c, i) => {
    c.addEventListener("click", () => open(i));
    const img = $("img", c);
    img.addEventListener("error", () => {           // missing thumbnail → full image
      if (img.dataset.fellBack) return;
      img.dataset.fellBack = "1";
      img.src = c.dataset.full;
    });
  });
  // "View certificate" buttons elsewhere (e.g. the internship entry)
  $$("[data-cert-index]").forEach((b) => b.addEventListener("click", () => open(+b.dataset.certIndex)));

  $("#lbClose").addEventListener("click", close);
  $("#lbPrev").addEventListener("click", () => show(index - 1));
  $("#lbNext").addEventListener("click", () => show(index + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
  addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") show(index + 1);
    if (e.key === "ArrowLeft") show(index - 1);
  });
  let sx = null;
  lb.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    sx = null;
  });
});
