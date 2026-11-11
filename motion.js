/* Motion layer: GSAP + ScrollTrigger, vendored in assets/vendor so the page needs no
   third-party script and the CSP can stay at script-src 'self'.

   What moves, and why:
   - hero: headline, lede, actions rise in, then the stat panel. It shows what the product
     is in one gesture. The panel selectors are scoped to the hero, because the supply
     readout is its own section further down and animates only through its own reveal.
   - sections: heads, lists and panels fade up once, on first entry, so the page reads in
     the order it was written. Nothing loops, nothing is pinned, nothing scrubs.
   - supply: the cap counts up once when it enters the viewport, because that number is
     the point of the section.

   Everything lives inside gsap.matchMedia, so with prefers-reduced-motion the authored
   DOM is the final state and no animation is created at all. */

(function () {
  "use strict";

  var gsap = window.gsap;
  if (!gsap) return;

  var ScrollTrigger = window.ScrollTrigger;
  if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  var mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: reduce)", function () {
    /* Nothing to build: the markup already shows the finished state. */
  });

  mm.add("(prefers-reduced-motion: no-preference)", function () {
    var timeline = gsap.timeline({ defaults: { ease: "power3.out", duration: 0.7 } });

    timeline
      .from(".hero-copy > *", { y: 20, opacity: 0, stagger: 0.08 })
      .from(".hero-grid .stat-strip", { y: 16, opacity: 0, duration: 0.8 }, "-=0.55");

    if (!ScrollTrigger) return;

    gsap.utils.toArray("[data-reveal]").forEach(function (el) {
      var staggered = el.hasAttribute("data-stagger");
      var targets = staggered ? Array.prototype.slice.call(el.children) : el;
      gsap.from(targets, {
        y: 22,
        /* opacity, not autoAlpha: autoAlpha also sets visibility:hidden, which would take
           every below-fold section out of the accessibility tree and out of the tab order
           until the visitor scrolls. Fading alone keeps the content reachable. */
        opacity: 0,
        duration: 0.65,
        ease: "power3.out",
        stagger: staggered ? 0.06 : 0,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });

    var counter = document.querySelector("[data-count]");
    if (counter) {
      var target = parseInt(counter.getAttribute("data-count"), 10);
      if (!isNaN(target)) {
        var ticker = { value: 0 };
        /* Show the zero state until the section is reached, so the count runs from 0
           instead of snapping back from the authored figure. */
        counter.textContent = "0";
        gsap.to(ticker, {
          value: target,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: { trigger: counter, start: "top 85%", once: true },
          onUpdate: function () {
            counter.textContent = Math.round(ticker.value).toLocaleString("en-US");
          },
        });
      }
    }

    /* Webfonts land after first paint and shift the layout, so re-measure once they do. */
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        ScrollTrigger.refresh();
      });
    }
  });
})();
