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
})();
