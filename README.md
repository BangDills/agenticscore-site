# agenticscore-site

Static site for the AgenticScore project: a soulbound NFT that carries a Binance
Agentic Wallet's activity reputation. Three files, no build step, no dependencies.

```
index.html    page structure and content
styles.css    design tokens, layout, states
app.js        section nav and the wallet address check
assets/mark.svg   placeholder favicon mark
SCORING.md    draft scoring spec for the backend (values not published on the page)
```

## Run locally

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Deploy

Any static host. On Vercel: import the repo, leave the framework preset as
**Other**, build command empty, output directory the repo root. The custom
domain is pointed in Vercel's dashboard, not in this repo.

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

- Palette: void black canvas, white text, silver neutrals, one vermilion accent
  (`#ff4b3a`) reserved for the meter needle and small data labels.
- Type: Archivo for display and body, Azeret Mono for measured data (addresses,
  step numbers, field labels).
- The gauge is the identity motif: the product is a score, so the score meter is
  the hero visual rather than a mock product screenshot.
- `assets/mark.svg` is a placeholder mark, not a designed logo. Replace it.
