/* =========================================================
   preloader.js — loading screen, then CMO.setReady().

   Recruiter-friendly:
   • first visit: a short ~1.1s intro
   • returning within the same browser session: skipped entirely
   • can always be skipped with a click, tap, Esc, Enter or Space
   ========================================================= */
window.CMO.module("preloader", function () {
  "use strict";
  const { $, reduceMotion } = window.CMO;

  const preloader = $("#preloader");
  let seenThisSession = false;
  try { seenThisSession = sessionStorage.getItem("cmo-intro") === "1"; sessionStorage.setItem("cmo-intro", "1"); } catch (e) { /* storage blocked */ }

  if (!preloader || reduceMotion || seenThisSession) {
    if (preloader) preloader.remove();
    window.CMO.setReady();
    return;
  }

  const count = $("#loaderCount");
  const bar = $("#loaderBar");
  const status = $("#loaderStatus");
  const steps = ["Welcome! Getting things ready…", "Loading experience…", "Loading projects…", "Loading certificates…", "Ready ✓"];
  const hint = document.createElement("p");
  hint.className = "preloader__skip";
  hint.textContent = "Click or press any key to skip";
  $(".preloader__inner", preloader).appendChild(hint);

  document.body.classList.add("is-loading");
  let done = false;
  function finish() {
    if (done) return;
    done = true;
    count.textContent = "100";
    bar.style.width = "100%";
    status.textContent = steps[steps.length - 1];
    preloader.classList.add("is-done");
    window.CMO.setReady();
    removeEventListener("keydown", finish);
    setTimeout(() => preloader.remove(), 1300);
  }
  preloader.addEventListener("click", finish);
  addEventListener("keydown", finish);

  const t0 = performance.now();
  const duration = 1100;
  (function tick(now) {
    if (done) return;
    const p = Math.min((now - t0) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    const val = Math.round(eased * 100);
    count.textContent = val;
    bar.style.width = val + "%";
    status.textContent = steps[Math.min(steps.length - 1, Math.floor(eased * steps.length))];
    if (p < 1) requestAnimationFrame(tick);
    else setTimeout(finish, 200);
  })(t0);
});
