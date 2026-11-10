# agenticscore-site

Static site for the AgenticScore project: a soulbound NFT that carries a Binance
Agentic Wallet's activity reputation. No build step, no framework, no third-party
runtime request.

```
index.html        page structure and content
styles.css        design tokens, layout, states
app.js            section nav and the wallet address check
motion.js         GSAP reveal and counter layer
assets/vendor/    GSAP 3.13.0 (gsap + ScrollTrigger), see its README for the licence
assets/mark.png   logo mark, white on transparent, from the project's own artwork
assets/favicon.png, assets/apple-touch-icon.png   the same mark on a navy plate
assets/logos/     X, BscScan and Sourcify marks for the footer row
SCORING.md        draft scoring spec for the backend (values not published on the page)
```

## Run locally

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Deploy

Any static host. On Vercel: import the repo, leave the framework preset as
**Other**, build command empty, output directory the repo root. The custom
domain is pointed in Vercel's dashboard, not in this repo. `vercel.json` carries
the security headers, including a CSP that allows only same-origin scripts plus
Google Fonts.

## What is live and what is not

The page is honest about its own state, and it should stay that way:

- No contract is deployed, so there is no mint button. Minting happens through the agent
  prompt, which tells the agent to stop unless a contract address is published on the site.
- The wallet check validates EVM address format in the browser. The allowlist
  lookup needs the verification backend; set `window.AGENTICSCORE_API` to the
  endpoint URL to turn that path on, and the loading, success, and error states
  start working against real data.
- The leaderboard is an empty table on purpose. Scores are open-ended, the top 100
  share a 1,000 USDT pool every week, paid from a separate wallet at the end of each
  7-day snapshot. The rank-band split is published; the first snapshot date and the minimum score to qualify are not. No contract is configured
  for rewards. There are no rarity tiers: every NFT is identical.
- The agent prompt has a placeholder for the wallet address and tells the agent to read
  the contract address from the site, so no address is hardcoded.
- No statistics or mint counts are published,
  because the project has not published them.

## Design notes

The visual language was measured from arkm.com (its CSS, its fonts, its keyframes) and
then rebuilt for this project, not copied wholesale:

- Canvas `#0a0d16`, the reference's body background: near-black navy, not pure black.
- One accent. `#2563eb` fills buttons (`#ffffff` on it is 4.78:1), `#6da3ff` carries links
  and figures (7.7:1 on the canvas). `#2563eb` never holds small text, it is only 3.75:1.
- Type: Archivo at weight 200 for the large headlines with -0.038em tracking, the
  reference's thin-display gesture. IBM Plex Mono for addresses, figures, step numbers
  and field labels, the same mono the reference uses.
- Radii 4/6/10px. No pills: shape carries hierarchy, controls stay rectangular.
- Panels are `#10111a` with a hairline border and a light top edge, and two of them carry
  a light-sweep "glint" on hover, the reference's `--glint-period` device.
- The gauge is this project's own motif: the product is a score, so the score meter is the
  hero visual rather than a mock product screenshot.
- On phones the specification rows become a stacked card deck: drag the top card sideways
  to uncover the next one. The card that leaves goes to the bottom of the pile, so the
  deck cycles and never runs out. The deck is a single tab stop and the arrow keys work on
  it, since it has no visible controls. The deck is progressive enhancement (a
  `.deck-ready` class added by `app.js`), so without JavaScript the rows stay the plain
  list they are on desktop.
- The FAQ is the reference's own block pattern, measured from its markup: each question is
  a rounded card (`#151620`, 16px radius, 8px apart), the question sits in white at weight
  300, the answer in `#abb2ca` at weight 200, and the toggle is two 2px bars that overlap
  into a minus when the card is open. Native `details`/`summary` carries it, so it works
  without JavaScript and the card takes the focus ring.
- The header menu on a phone is the panel that drops under the header, exactly as before;
  the only change is the trigger, which is now three 2px lines in a 44px button with no
  border or fill instead of the word "Menu". It rotates into an X while open, carries
  `aria-expanded` and `aria-label`, and Escape returns focus to it. Above 860px the same
  markup is the plain inline row.
- Footer: the mark sits before the name, the name is set in caps, and X, BscScan and
  Sourcify are the reference's own footer buttons (36px square, 8px radius, `#10111a`
  fill, `#272c3a` border, 20px mark, shadow on hover). `-webkit-tap-highlight-color:
  transparent` is set globally, the line the reference ships, so tapping a block never
  flashes the platform highlight.
- The mark is the project's own artwork (wallet plus score gauge), converted to a white
  transparent PNG for the header and plated on navy for the favicon and touch icon. The
  source file was a 2048px JPEG; if an SVG original exists, drop it in and it will be
  sharper at large sizes.

## Motion

GSAP 3.13 + ScrollTrigger, vendored in `assets/vendor/` so no third-party script is
loaded at runtime and the CSP stays at `script-src 'self'`. `motion.js` holds all of it:

- hero: copy, stat strip, panel and needle rise and settle once on load;
- sections: heads, lists and panels fade up once on first entry;
- supply: the 3,000 figure counts up once when it enters the viewport.

Nothing loops, nothing is pinned, nothing scrubs. Every animation is registered inside
`gsap.matchMedia()`, so under `prefers-reduced-motion: reduce` none is created and the
markup's own state is what ships. The needle has no CSS animation either: its SVG
position is already the settled reading, so a browser without JavaScript shows a still,
correct meter.
