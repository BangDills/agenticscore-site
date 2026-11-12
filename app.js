/* AgenticScore site behaviour.
   Only two real controls exist: the section nav and the wallet address check.
   The address check verifies EVM address format in the browser. The allowlist
   lookup needs the verification backend, so it is reported as not connected
   until window.AGENTICSCORE_API points at a deployed endpoint. */

(function () {
  "use strict";

  /* ---------- Header menu (phones) ---------- */

  /* The trigger is the only thing that changed here: three lines instead of the word
     "Menu", with no border or fill. The panel still drops under the header, as before. */

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  function navOpen() {
    return nav && nav.getAttribute("data-open") === "true";
  }

  function setNav(open, returnFocus) {
    if (!toggle || !nav) return;
    nav.setAttribute("data-open", open ? "true" : "false");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    if (!open && returnFocus) toggle.focus();
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setNav(!navOpen());
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) setNav(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navOpen()) setNav(false, true);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860 && navOpen()) setNav(false);
    });
  }

  /* ---------- Copy buttons (agent skill address and prompt) ---------- */

  var copyButtons = document.querySelectorAll("[data-copy]");

  Array.prototype.forEach.call(copyButtons, function (button) {
    var target = document.querySelector(button.getAttribute("data-copy"));
    var label = button.textContent;
    if (!target) return;

    button.addEventListener("click", function () {
      function settle(ok) {
        if (!ok && window.getSelection) {
          var range = document.createRange();
          range.selectNodeContents(target);
          var selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
        button.textContent = ok ? "Copied" : "Selected, press Ctrl or Cmd + C";
        window.setTimeout(function () {
          button.textContent = label;
        }, 2600);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(target.textContent).then(
          function () { settle(true); },
          function () { settle(false); }
        );
        return;
      }
      settle(false);
    });
  });

  /* ---------- Mint supply ---------- */

  /* The panel reads the contract itself over JSON-RPC: totalSupply(), MAX_SUPPLY() and
     mintOpen(). No endpoint and no key are involved, so the counter, the bar and the status
     line say what the chain says, refreshed every 30 seconds while the tab is visible. */

  var SUPPLY_CAP = 3000;
  var SUPPLY_RPC = "https://bsc-dataseed.bnbchain.org";
  var CONTRACT = "0x9ABB0c362B6F907b9Dadb8941E5C04B0705e7EF0";
  var supplySource = window.AGENTICSCORE_SUPPLY || SUPPLY_RPC;
  var supplyCount = document.getElementById("supply-minted");
  var supplyFill = document.getElementById("supply-fill");
  var supplyTrack = document.getElementById("supply-track");
  var supplyStatus = document.getElementById("supply-status");
  var supplyState = document.getElementById("supply-state");

  function renderSupply(minted, cap, open) {
    if (!supplyCount) return;
    var total = cap > 0 ? cap : SUPPLY_CAP;
    var count = minted > 0 ? minted : 0;
    var share = Math.min(100, (count / total) * 100);
    supplyCount.textContent = count.toLocaleString("en-US");
    if (supplyFill) supplyFill.style.width = share.toFixed(2) + "%";
    if (supplyTrack) {
      supplyTrack.setAttribute("aria-valuenow", String(count));
      supplyTrack.setAttribute("aria-valuemax", String(total));
    }
    if (supplyStatus) {
      supplyStatus.textContent = open ? (count > 0 ? "Live" : "Open") : "Not open";
      supplyStatus.setAttribute("data-live", open ? "true" : "false");
    }
    if (supplyState) {
      supplyState.textContent = open
        ? count > 0
          ? "Read from the contract, refreshed every 30 seconds."
          : "Minting is open. Nothing is minted yet. This counter reads the contract."
        : "Minting is not open, so nothing is minted.";
    }
  }

  function callContract(selector) {
    return window
      .fetch(supplySource, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_call",
          params: [{ to: CONTRACT, data: selector }, "latest"],
        }),
      })
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(function (data) {
        return data && data.result ? BigInt(data.result) : null;
      });
  }

  function readSupply() {
    if (!supplySource || !window.fetch) return;
    if (document.visibilityState === "hidden") return;
    Promise.all([
      callContract("0x18160ddd"), // totalSupply()
      callContract("0x32cb6b0c"), // MAX_SUPPLY()
      callContract("0x24bbd049"), // mintOpen()
    ])
      .then(function (values) {
        if (values[0] === null || values[2] === null) return;
        var cap = values[1] === null ? SUPPLY_CAP : Number(values[1]);
        renderSupply(Number(values[0]), cap, values[2] !== BigInt(0));
      })
      .catch(function () {
        /* Leave the last read on screen rather than replacing it with a guess. */
      });
  }

  if (supplyCount) {
    renderSupply(0, SUPPLY_CAP, true);
    if (supplySource) {
      readSupply();
      window.setInterval(readSupply, 30000);
      document.addEventListener("visibilitychange", readSupply);
    }
  }

  /* ---------- Agent prompt panel height ---------- */

  /* Hold the prompt panel to the height of the skill panel above it, so the pair reads as
     two equal blocks instead of one tall column of prompt text. Re-measured when the
     skill panel changes size, on resize, and once the webfonts have settled. */

  var skillPanel = document.querySelector(".prompt-skill");
  var promptPanel = document.querySelector(".prompt-script");

  function fitPromptPanel() {
    if (!skillPanel || !promptPanel) return;
    var height = Math.round(skillPanel.getBoundingClientRect().height);
    if (height > 0) promptPanel.style.height = height + "px";
  }

  if (skillPanel && promptPanel) {
    fitPromptPanel();
    window.addEventListener("resize", fitPromptPanel);
    if (window.ResizeObserver) new ResizeObserver(fitPromptPanel).observe(skillPanel);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPromptPanel);
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

  /* ---------- Leaderboard ---------- */

  /* Rows come from the verification backend, which builds them from the contract's Minted logs
     and recomputes every score. A row cannot exist without a token on chain, and nothing here
     is a sample. */

  var BOARD_ENDPOINT = "https://agenticscore-api.38-47-85-182.sslip.io/leaderboard";
  var boardBody = document.getElementById("board-body");

  function shortAddress(address) {
    return address.slice(0, 6) + "..." + address.slice(-4);
  }

  function boardRow(row) {
    var tr = document.createElement("tr");

    var rank = document.createElement("td");
    rank.textContent = String(row.rank);

    var wallet = document.createElement("td");
    var link = document.createElement("a");
    link.href = "https://bscscan.com/address/" + row.wallet;
    link.rel = "noopener";
    link.textContent = shortAddress(row.wallet);
    wallet.appendChild(link);

    var score = document.createElement("td");
    score.textContent = Number(row.score).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    tr.appendChild(rank);
    tr.appendChild(wallet);
    tr.appendChild(score);
    return tr;
  }

  function renderBoard(data) {
    if (!boardBody || !data || !data.rows) return;
    while (boardBody.firstChild) boardBody.removeChild(boardBody.firstChild);
    if (data.rows.length === 0) {
      var empty = document.createElement("tr");
      empty.className = "board-empty";
      var cell = document.createElement("td");
      cell.colSpan = 3;
      cell.textContent = "No scores yet.";
      empty.appendChild(cell);
      boardBody.appendChild(empty);
      return;
    }
    data.rows.forEach(function (row) {
      boardBody.appendChild(boardRow(row));
    });
  }

  function readBoard() {
    if (!boardBody || !window.fetch) return;
    if (document.visibilityState === "hidden") return;
    window
      .fetch(BOARD_ENDPOINT, { headers: { accept: "application/json" } })
      .then(function (response) {
        return response.ok ? response.json() : null;
      })
      .then(function (data) {
        if (data && data.ok) renderBoard(data);
      })
      .catch(function () {
        /* Leave the table as it is rather than replacing it with a guess. */
      });
  }

  if (boardBody) {
    readBoard();
    window.setInterval(readBoard, 60000);
    document.addEventListener("visibilitychange", readBoard);
  }
})();
