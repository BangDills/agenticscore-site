# agenticscore-site

Static site for the AgenticScore project: a soulbound NFT that carries a Binance
Agentic Wallet's activity reputation. Three files, no build step, no dependencies.

```
index.html    page structure and content
styles.css    design tokens, layout, states
app.js        section nav and the wallet address check
assets/mark.svg   placeholder favicon mark
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

- No contract is deployed, so the mint button is disabled on purpose.
- The wallet check validates EVM address format in the browser. The allowlist
  lookup needs the verification backend; set `window.AGENTICSCORE_API` to the
  endpoint URL to turn that path on, and the loading, success, and error states
  start working against real data.
- No statistics, mint counts, tier names, or tier thresholds are published,
  because the project has not published them.

## Design notes

- Palette: void black canvas, white text, silver neutrals, one vermilion accent
  (`#ff4b3a`) reserved for the meter needle and small data labels.
- Type: Archivo for display and body, Azeret Mono for measured data (addresses,
  step numbers, field labels).
- The gauge is the identity motif: the product is a score, so the score meter is
  the hero visual rather than a mock product screenshot.
- `assets/mark.svg` is a placeholder mark, not a designed logo. Replace it.
