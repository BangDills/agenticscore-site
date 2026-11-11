/* Intro: a short splash on entry. The wordmark sits in the middle of the screen and five
   "txid" lines run beneath it, each carrying a random 0x address that is replaced every
   few hundred milliseconds. The addresses are decoration only. They are random and refer
   to no real transaction.

   This file is loaded in <head> without defer on purpose: it adds a class to <html>
   before the first paint, so the page never flashes before the splash and never flashes
   the splash for a visitor who should not get it. The splash stays hidden from the
   start unless this script switches it on, so with JavaScript off nothing blocks the page.

   Who sees it: once per browser tab session. Not at all with prefers-reduced-motion.
   Click, tap, or any key ends it early. A CSS timer in styles.css hides it even if this
   file stops half way, and the hero animation in motion.js waits for the "intro:done"
   event so it plays as the splash fades, not behind it. */

(function () {
  "use strict";

  var KEY = "agenticscore-intro-seen";
  var SHOW_MS = 2800;   /* how long the lines run before the splash leaves */
  var TICK_MS = 220;    /* how often a fresh address drops in */
  var LINES = 5;

  var root = document.documentElement;

  var seen = false;
  try { seen = window.sessionStorage.getItem(KEY) === "1"; } catch (e) { /* storage blocked */ }
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (seen || reduced) {
    root.classList.add("intro-skip");
    return;
  }

  root.classList.add("intro-running");

  var finished = false;
  var ticker = null;

  /* Timers first, before anything that could throw. */
  var leaveTimer = window.setTimeout(leave, SHOW_MS);
  window.setTimeout(unlock, SHOW_MS + 1500);

  function unlock() {
    root.classList.remove("intro-running");
    try { window.sessionStorage.setItem(KEY, "1"); } catch (e) { /* storage blocked */ }
  }

  function leave() {
    if (finished) return;
    finished = true;
    window.clearTimeout(leaveTimer);
    window.clearInterval(ticker);
    document.removeEventListener("keydown", leave);

    var overlay = document.getElementById("intro");
    if (overlay) overlay.classList.add("intro-leaving");

    /* The class covers a listener that attaches after the event has already fired. */
    root.classList.add("intro-done");
    document.dispatchEvent(new CustomEvent("intro:done"));

    window.setTimeout(unlock, 650);
  }

  function hex(length) {
    var chars = "0123456789abcdef";
    var out = "";
    for (var i = 0; i < length; i++) out += chars.charAt(Math.floor(Math.random() * 16));
    return out;
  }

  function makeLine() {
    var li = document.createElement("li");
    var key = document.createElement("span");
    key.className = "intro-k";
    key.textContent = "txid :";
    li.appendChild(key);
    li.appendChild(document.createTextNode(" 0x" + hex(40)));
    return li;
  }

  function start() {
    var feed = document.getElementById("intro-feed");
    var overlay = document.getElementById("intro");
    if (!feed || finished) return;

    if (overlay) overlay.addEventListener("click", leave);
    document.addEventListener("keydown", leave);

    function tick() {
      feed.insertBefore(makeLine(), feed.firstChild);
      while (feed.children.length > LINES) feed.removeChild(feed.lastChild);
    }

    tick();
    ticker = window.setInterval(tick, TICK_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
