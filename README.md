# agenticscore-site

Static site for the AgenticScore project: a soulbound NFT that carries a Binance
Agentic Wallet's activity reputation. No build step, no framework, no third-party
runtime request.

```
index.html        page structure and content
styles.css        design tokens, layout, states
app.js            section nav and the wallet address check
motion.js         GSAP reveal and counter layer
intro.js          entry splash: wordmark plus five rows of random txid lines (decoration only)
assets/vendor/    GSAP 3.13.0 (gsap + ScrollTrigger), see its README for the licence
assets/mark.png   logo mark, white on transparent, from the project's own artwork
assets/favicon.png, assets/apple-touch-icon.png   the same mark on a navy plate
assets/logos/     X, BscScan and Sourcify marks for the footer row, and the USDT mark
                  used inline in the weekly reward split (from the MIT-licensed
                  spothq/cryptocurrency-icons set)
skill.md          agent skill: lets an agent mint with no pasted prompt (served at /skill.md)
terms.html        Terms of Service (status, keys, the NFT, score and rewards, liability)
privacy.html      Privacy (what is stored, what third parties see, on chain data)
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

### Where it is served

| Host | URL | Notes |
| --- | --- | --- |
| GitHub Pages (org site) | https://agenticscore.github.io | the home, and the address printed on the site. Repo `agenticscore/agenticscore.github.io`, branch `main` at `/`. Serves `/skill.md` as `text/markdown`. |
| Vercel | https://agenticscore-nu.vercel.app | mirror. Sends the headers in `vercel.json`, and serves `/skill.md` as `text/plain`. |
| GitHub Pages (project site) | https://bangdills.github.io/agenticscore-site/ | mirror, built from the source repo `BangDills/agenticscore-site`. |

`agenticscore.github.io` needs a GitHub account or organisation named `agenticscore`; a
`*.github.io` address cannot be claimed as a custom domain on any other repo (GitHub rejects
it with "Invalid cname"). The org exists, and its `<org>.github.io` repo is the user site, so
Pages serves it at the root.

GitHub Pages cannot send response headers, so the CSP from `vercel.json` does not apply to
either Pages copy. The pages still work there: no inline script, every asset same-origin.

`.nojekyll` is required on both Pages copies. Without it Jekyll runs on the branch and renders
`skill.md` into HTML instead of serving it as text, and that file is exactly what an agent
fetches.

Shipping a change means one push plus one deploy. `origin` carries two push URLs, so a single
`git push` updates both repos, and Vercel is deployed by hand:

```bash
cd /root/agenticscore-site && git add -A && git commit -m "..." && git push && vercel --prod
```

## What is live and what is not

The page is honest about its own state, and it should stay that way:

- The contract is deployed at `0x9ABB0c362B6F907b9Dadb8941E5C04B0705e7EF0` with minting open, and
  the verification backend that issues vouchers is live, so an agent that follows `skill.md` can
  mint end to end. There is still no mint button on the page: minting happens through an agent.
  The earlier free contract at `0xdb4aDa50DBa6445Fd56F1d3ea3309bb5519b40A8` is closed and unused.
- Minting costs 0.00008 BNB, set by the contract's `mintFee`, plus network gas of about 0.000005 BNB
  (85,000 to 105,000 gas at BSC's 0.05 gwei, measured on the deployed contract). The fee goes to the
  project; the gas goes to the network's validators. Every mention of the price has to match what
  `mintFee()` reports, because anyone can read it.
- `skill.md` has a Launch settings block (STATUS, CONTRACT_ADDRESS, VERIFY_ENDPOINT,
  MINT_FUNCTION). It is filled in and OPEN, and it spells out the two calls the backend exposes.
  The skill tells the agent to trust that block and nothing else.
- The supply panel in the hero reads zero because nothing is minted and minting is not open.
  Point `window.AGENTICSCORE_SUPPLY` at an endpoint answering `{"minted": n, "max": 3000}` to
  make it live; until then it keeps saying what is true, and it never shows a number that
  nobody can verify.
- The site has no wallet checker. Eligibility and the starting score are decided by
  the verification backend when the agent mints, so the page never shows a wallet its
  score before minting. `window.AGENTICSCORE_API` and the checker were removed with the
  section; the git history has them if that call is ever reversed.
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
- One accent. `#3263af`, sampled from the reference's "Sign up for free" button, fills buttons
  (`#ffffff` on it is 5.93:1), `#6da3ff` carries links and figures (7.7:1 on the canvas).
  `#3263af` never holds small text, it is only 3.27:1 on the canvas. The hover fill
  `#2c579a` was chosen here, not sampled.
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
