/* AgenticScore site behaviour.
   Only two real controls exist: the section nav and the wallet address check.
   The address check verifies EVM address format in the browser. The allowlist
   lookup needs the verification backend, so it is reported as not connected
   until window.AGENTICSCORE_API points at a deployed endpoint. */

(function () {
  "use strict";

  var EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

  /* ---------- Mobile navigation ---------- */

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  function setNav(open) {
    if (!toggle || !nav) return;
    nav.setAttribute("data-open", open ? "true" : "false");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.textContent = open ? "Close" : "Menu";
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setNav(nav.getAttribute("data-open") !== "true");
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setNav(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.getAttribute("data-open") === "true") {
        setNav(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) setNav(false);
    });
  }

  /* ---------- Wallet address check ---------- */

  var form = document.querySelector(".checker-form");
  var input = document.getElementById("wallet-address");
  var result = document.querySelector(".checker-result");

  function render(node, isError) {
    result.textContent = "";
    result.classList.toggle("is-error", Boolean(isError));
    result.appendChild(node);
  }

  function line(className, text) {
    var el = document.createElement("p");
    el.className = className;
    el.textContent = text;
    return el;
  }

  function stateLine(text, busy) {
    var el = document.createElement("p");
    el.className = "result-state";
    if (busy) {
      var spinner = document.createElement("span");
      spinner.className = "spinner";
      spinner.setAttribute("aria-hidden", "true");
      el.appendChild(spinner);
    }
    var strong = document.createElement("strong");
    strong.textContent = text;
    el.appendChild(strong);
    return el;
  }

  function definitionGrid(rows) {
    var dl = document.createElement("dl");
    dl.className = "result-grid";
    rows.forEach(function (row) {
      var wrap = document.createElement("div");
      var dt = document.createElement("dt");
      dt.textContent = row[0];
      var dd = document.createElement("dd");
      if (row[2]) dd.className = "mono";
      dd.textContent = row[1];
      wrap.appendChild(dt);
      wrap.appendChild(dd);
      dl.appendChild(wrap);
    });
    return dl;
  }

  function formatProblem(address) {
    if (!address) return "Enter a wallet address to check.";
    if (!address.startsWith("0x") && !address.startsWith("0X")) {
      return "EVM addresses start with 0x. Check that the whole address was pasted.";
    }
    if (address.length !== 42) {
      return (
        "An EVM address is 42 characters: 0x plus 40 hex digits. This one is " +
        address.length +
        " characters."
      );
    }
    return "The address contains characters that are not hexadecimal, so it is not a valid EVM address.";
  }

  function showInvalid(address) {
    var fragment = document.createDocumentFragment();
    fragment.appendChild(stateLine("Invalid address", false));
    fragment.appendChild(line("result-empty", formatProblem(address)));
    render(fragment, true);
  }

  function showResult(address, allowlistText) {
    var fragment = document.createDocumentFragment();
    fragment.appendChild(stateLine("Format valid", false));
    fragment.appendChild(
      definitionGrid([
        ["Address", address, true],
        ["Format", "40 hex digits with the 0x prefix, as an EVM address requires"],
        ["Allowlist", allowlistText],
      ])
    );

    var copy = document.createElement("button");
    copy.type = "button";
    copy.className = "btn btn-ghost btn-small";
    copy.textContent = "Copy address";
    copy.addEventListener("click", function () {
      copyAddress(address, copy);
    });
    fragment.appendChild(copy);
    render(fragment, false);
  }

  function copyAddress(address, button) {
    function settle(ok) {
      if (!ok) {
        // Clipboard access can be denied. Select the address so a manual copy is one keystroke away.
        var node = document.querySelector(".checker-result .mono");
        if (node && window.getSelection) {
          var range = document.createRange();
          range.selectNodeContents(node);
          var selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      button.textContent = ok ? "Copied" : "Selected, press Ctrl or Cmd + C";
      window.setTimeout(function () {
        button.textContent = "Copy address";
      }, 2600);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(address).then(
        function () {
          settle(true);
        },
        function () {
          settle(false);
        }
      );
      return;
    }
    settle(false);
  }

  function checkAllowlist(address) {
    var endpoint = window.AGENTICSCORE_API;
    if (!endpoint) {
      return Promise.resolve(
        "Not checked. The verification backend is not deployed yet, so this page can only confirm the address format."
      );
    }
    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: address }),
    })
      .then(function (response) {
        if (!response.ok) throw new Error("The backend answered with HTTP " + response.status + ".");
        return response.json();
      })
      .then(function (data) {
        if (data && data.eligible === true) return "On the allowlist. Minting opens once the contract deploys.";
        if (data && data.eligible === false) return "Not on the allowlist. Ask the operator to add this address.";
        return "The backend answered without an allowlist verdict.";
      })
      .catch(function (error) {
        throw new Error("Could not reach the verification backend. " + error.message);
      });
  }

  if (form && input && result) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var address = input.value.trim();
      if (!EVM_ADDRESS.test(address)) {
        showInvalid(address);
        input.focus();
        return;
      }

      render(stateLine("Checking address", true), false);
      checkAllowlist(address).then(
        function (allowlistText) {
          showResult(address, allowlistText);
        },
        function (error) {
          var fragment = document.createDocumentFragment();
          fragment.appendChild(stateLine("Check failed", false));
          fragment.appendChild(line("result-empty", error.message));
          render(fragment, true);
        }
      );
    });
  }

  /* ---------- Copy agent prompt ---------- */

  var copyButton = document.getElementById("copy-prompt");
  var promptText = document.getElementById("agent-prompt");

  if (copyButton && promptText) {
    copyButton.addEventListener("click", function () {
      function settle(ok) {
        if (!ok && window.getSelection) {
          var range = document.createRange();
          range.selectNodeContents(promptText);
          var selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
        copyButton.textContent = ok ? "Copied" : "Selected, press Ctrl or Cmd + C";
        window.setTimeout(function () {
          copyButton.textContent = "Copy prompt";
        }, 2600);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(promptText.textContent).then(
          function () { settle(true); },
          function () { settle(false); }
        );
        return;
      }
      settle(false);
    });
  }

  /* ---------- Specification deck (phones only) ---------- */

  /* Under 860px the specification rows are laid out as a deck: the first card on top,
     the rest stacked behind it showing a 12px strip each. Dragging the top card away
     sends it to the bottom of the pile, so the deck never runs out: the same six cards
     keep coming round. The arrow keys do the same thing on the focused deck, which is
     the keyboard path since the deck has no visible controls. Above that width none of
     this runs and the rows stay the plain two-column table. */

  var deck = document.querySelector(".spec-deck");
  var deckQuery = window.matchMedia("(max-width: 860px)");
  var STRIP = 12;
  var INSET = 7;
  var EXIT_MS = 320;

  if (deck && deckQuery) {
    var deckList = deck.querySelector(".spec-table");
    var deckCards = Array.prototype.slice.call(deckList.children);
    var order = deckCards.map(function (_, index) { return index; });
    var drag = null;
    var exitTimer = null;

    function layout() {
      order.forEach(function (cardIndex, depth) {
        var card = deckCards[cardIndex];
        card.setAttribute("data-depth", String(depth));
        card.style.setProperty("--stack-y", depth * STRIP + "px");
        /* Each card behind is inset rather than scaled: a scale would shrink the card
           around its centre and let its text show through the strip the card above
           leaves open. An inset keeps the bottom edge in place, so the strip is a clean
           edge of panel, not a slice of the text. */
        card.style.setProperty("--stack-x", depth * INSET + "px");
        card.style.zIndex = String(deckCards.length - depth);
        card.style.transform = "";
        /* The card that just flew out was faded to 0 on its way; it is back in the pile
           now, so the inline fade has to go with the transform. */
        card.style.opacity = "";
      });
    }

    function measure() {
      deck.classList.remove("deck-ready");
      var tallest = 0;
      deckCards.forEach(function (card) {
        tallest = Math.max(tallest, card.offsetHeight, card.scrollHeight);
      });
      /* Every card gets the tallest card's height, so the card on top always covers the
       ones behind it and each strip below is empty panel, not a slice of text. The cards
       stay fully opaque: a fade would let the card behind show through the strip. */
      deck.style.setProperty("--card-height", tallest + "px");
      deck.style.setProperty("--deck-height", tallest + (deckCards.length - 1) * STRIP + "px");
      deck.classList.add("deck-ready");
    }

    function next() {
      if (exitTimer) return;
      var card = deckCards[order[0]];
      var distance = deckList.clientWidth * 1.2;
      card.style.transform = "translate3d(" + distance + "px, 8px, 0) rotate(14deg)";
      card.style.opacity = "0";
      exitTimer = window.setTimeout(function () {
        exitTimer = null;
        card.style.transition = "none";
        order.push(order.shift());
        layout();
        void card.offsetWidth;
        card.style.transition = "";
      }, EXIT_MS);
    }

    /* Previous reorders and lets the card transition up out of the pile, so the same
       gesture reads in reverse without a second animation path. */
    function previous() {
      if (exitTimer) return;
      order.unshift(order.pop());
      layout();
    }

    function endDrag(pointerId) {
      if (!drag || drag.pointerId !== pointerId) return;
      var card = drag.card;
      var dx = drag.dx;
      window.clearTimeout(drag.holdTimer);
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerup", onUp);
      card.removeEventListener("pointercancel", onUp);
      if (card.releasePointerCapture) {
        try { card.releasePointerCapture(pointerId); } catch (error) { /* already released */ }
      }
      drag = null;
      card.classList.remove("is-dragging");
      if (Math.abs(dx) > deckList.clientWidth * 0.28) {
        var distance = dx < 0 ? -deckList.clientWidth * 1.2 : deckList.clientWidth * 1.2;
        var tilt = dx < 0 ? -14 : 14;
        card.style.transform = "translate3d(" + distance + "px, 8px, 0) rotate(" + tilt + "deg)";
        card.style.opacity = "0";
        exitTimer = window.setTimeout(function () {
          exitTimer = null;
          card.style.transition = "none";
          order.push(order.shift());
          layout();
          void card.offsetWidth;
          card.style.transition = "";
        }, EXIT_MS);
        return;
      }
      layout();
    }

    function onMove(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      drag.dx = event.clientX - drag.startX;
      if (!drag.lifted) {
        /* A quick sideways flick grabs the card. A gesture that stays vertical is left to
           the browser, so the page still scrolls when the visitor drags up or down here. */
        if (Math.abs(drag.dx) < 12) return;
        drag.lifted = true;
        window.clearTimeout(drag.holdTimer);
        drag.card.classList.add("is-dragging");
      }
      drag.card.style.transform =
        "translate3d(" + drag.dx + "px, 0, 0) rotate(" + (drag.dx / 26).toFixed(2) + "deg)";
    }

    function onUp(event) {
      endDrag(event.pointerId);
    }

    function onDown(event) {
      var card = event.currentTarget;
      if (card.getAttribute("data-depth") !== "0") return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      drag = { card: card, pointerId: event.pointerId, startX: event.clientX, dx: 0, lifted: false, holdTimer: null };
      card.setPointerCapture(event.pointerId);
      /* Hold to lift the card, the gesture the deck is built around. */
      drag.holdTimer = window.setTimeout(function () {
        if (!drag) return;
        drag.lifted = true;
        drag.card.classList.add("is-dragging");
      }, 160);
      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerup", onUp);
      card.addEventListener("pointercancel", onUp);
    }

    deckCards.forEach(function (card) {
      card.addEventListener("pointerdown", onDown);
    });

    deck.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") { event.preventDefault(); next(); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); previous(); }
      else if (event.key === "Home") { event.preventDefault(); while (order[0] !== 0) previous(); }
      else if (event.key === "End") { event.preventDefault(); while (order[0] !== deckCards.length - 1) next(); }
    });

    function applyDeckMode() {
      if (deckQuery.matches) {
        measure();
        layout();
        deck.setAttribute("tabindex", "0");
        deck.setAttribute("aria-label", "Project specification, " + deckCards.length + " cards. Drag the top card, or use the left and right arrow keys.");
      } else {
        deck.classList.remove("deck-ready");
        deck.removeAttribute("tabindex");
        deck.removeAttribute("aria-label");
        deck.removeAttribute("style");
        deckCards.forEach(function (card) {
          card.removeAttribute("data-depth");
          card.removeAttribute("style");
        });
      }
    }

    if (deckQuery.addEventListener) deckQuery.addEventListener("change", applyDeckMode);
    window.addEventListener("resize", function () {
      if (deckQuery.matches) { measure(); layout(); }
    });
    window.addEventListener("load", function () {
      if (deckQuery.matches) { measure(); layout(); }
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        if (deckQuery.matches) { measure(); layout(); }
      });
    }
    applyDeckMode();
  }
})();
