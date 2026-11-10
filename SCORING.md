# Scoring spec (draft)

Status: draft. The weights below are not final and are not published on the site.
The page only describes the activity types and the idea of diminishing returns.

## Why no 1-1000 cap

Only the top 100 wallets receive a reward. With a hard cap, many wallets can reach the
maximum and tie, so the top 100 cannot be decided. The score is open-ended instead,
and spam is held down by diminishing returns per activity type.

## Formula

For each activity type, points = weight x ln(1 + count). Score = sum over all types.
Rank by the unrounded score. Display it rounded to a whole number.

| Activity | Weight |
| --- | --- |
| Token swap | 40 |
| NFT mint (other collections) | 25 |
| Transfer | 10 |
| Active day | 30 |

Worked example: 100 mints, 20 swaps, 50 transfers, 7 active days (the most a 7-day window allows).

- Mints: 25 x ln(101) = 115.4
- Swaps: 40 x ln(21) = 121.8
- Transfers: 10 x ln(51) = 39.3
- Active days: 30 x ln(8) = 62.4
- Score: 338.9, displayed as 338

Effect of the log: going from 50 to 5,000 transfers (100x the work) adds only
46 points. Doubling the number of different things a wallet does is worth far more
than repeating one cheap action.

## Rules

- Each transaction hash counts once.
- Transfers between the user's own wallets are ignored.
- Swaps and transfers below a minimum value are ignored (threshold to be decided).
- Snapshot: every 7 days. Only activity inside the current window counts (first start date to be decided).
- Only wallets that hold an AgenticScore NFT are ranked. One NFT per wallet.
- Tie-break: earliest mint of the AgenticScore NFT. Ties should be rare because ranking uses the unrounded score.

## Rewards

- Pool: 1,000 USDT per weekly snapshot for the top 100 wallets, distributed at the end of each snapshot from a separate wallet. No reward logic lives in the NFT contract.
- The snapshot repeats every 7 days. Each cycle counts only activity inside its own 7-day window, so scores start fresh every cycle.
- Split of the 1,000 USDT weekly pool (rank bands, published on the site):

| Rank | Wallets | USDT each | Band total | Share of pool |
| --- | --- | --- | --- | --- |
| 1 | 1 | 100 | 100 | 10.0% |
| 2 | 1 | 75 | 75 | 7.5% |
| 3 | 1 | 60 | 60 | 6.0% |
| 4-10 | 7 | 25 | 175 | 17.5% |
| 11-30 | 20 | 12 | 240 | 24.0% |
| 31-100 | 70 | 5 | 350 | 35.0% |
| Total | 100 | | 1000 | 100.0% |

  Rank 1 earns 20x rank 100, so the top still matters, and every rewarded wallet gets at least 5 USDT.
  Equal shares (10 USDT each) is the alternative, but rank 1 and rank 100 would then earn the same.
- Suggested: a minimum score to qualify for a reward, so a wallet with almost no activity does not
  collect 5 USDT just for being in the top 100 of a quiet week. Unpaid amounts roll into the next pool or stay in the reward wallet (to decide).
- There are no rarity tiers. Every NFT is identical, and the score is not stored in the token.

## Agent flow

Minting happens through the agent prompt in index.html. After minting, the agent looks up the
wallet's score and rank on the leaderboard and reports them. The prompt tells the agent to say
so if the wallet is not listed yet, instead of guessing.

## Known limit

Diminishing returns slow down spam but do not stop someone running many wallets.
The allowlist and the one-NFT-per-wallet rule are what limit that.

## Open decisions

- Final weights.
- Dust thresholds for swaps and transfers.
- First snapshot start date, and whether a wallet that mints mid-cycle is scored for that cycle.
- Active days max out at 7 in a 7-day window, so re-check the active-day weight.
- The minimum score to qualify for a reward, and what happens to unpaid amounts.
- Whether the AgenticScore mint itself earns points (suggested: no).
- Which data source the backend reads to classify swaps, mints, and transfers.
- A score lookup the agent can read after minting (a page or endpoint on agenticscore.xyz). The agent prompt asks the agent to report score and rank from the leaderboard, so this has to exist before launch.
