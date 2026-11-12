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

Counts are cumulative from the start of the scope (to be decided, see open decisions) up to now,
so the score at mint is the starting score and it rises as the counts rise during the batch.

Worked example. At mint: 100 mints, 20 swaps, 50 transfers, 7 active days.

- Mints: 25 x ln(101) = 115.4
- Swaps: 40 x ln(21) = 121.8
- Transfers: 10 x ln(51) = 39.3
- Active days: 30 x ln(8) = 62.4
- Starting score: 338.9, displayed as 338

Later in the batch the same wallet adds 10 swaps, 20 transfers, and 2 active days
(30 swaps, 70 transfers, 9 active days): the score becomes 364.4, displayed as 364.
The 10 extra swaps add less than the first 10 did, because of the log.

Effect of the log: going from 50 to 5,000 transfers (100x the work) adds only
46 points. Doubling the number of different things a wallet does is worth far more
than repeating one cheap action.

## Rules

- Each transaction hash counts once.
- Transfers between the user's own wallets are ignored.
- Swaps and transfers below a minimum value are ignored (threshold to be decided).
- Timeline: the score is calculated at the moment of mint (the starting score). New activity during the batch adds to it. The batch is 7 days and ends with a snapshot, which ranks the wallets and triggers the reward. The first batch start date is to be decided.
- Only wallets that hold an AgenticScore NFT are ranked. One NFT per wallet.
- Tie-break: earliest mint of the AgenticScore NFT. Ties should be rare because ranking uses the unrounded score.

## Rewards

- Pool: 1,000 USDT per weekly snapshot for the top 100 wallets, distributed at the end of each snapshot from a separate wallet. No reward logic lives in the NFT contract.
- The snapshot repeats every 7 days. What happens to scores when the next batch starts (restart from a fresh starting score, or carry over) is not decided.
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

Minting happens through `skill.md` (served at /skill.md) or the agent prompt in index.html. The agent reads its own score from the
mint result, so it never has to open the website to find it. If the mint result has no score,
the prompt tells the agent to say so instead of guessing or calculating one.

Suggested build: after the agent signs the verification message, the backend verifies the
signature, computes the wallet's starting score at that moment, and returns it together with a
backend-signed voucher (score, wallet, expiry). The agent passes the voucher to the mint call, the
contract checks the backend signature, and the mint event includes the score. The agent then reads
the score from the receipt.

The reference contract (agenticscore-contracts) implements exactly this: `mint(uint256 score,
uint256 deadline, bytes signature)`, an EIP-712 voucher `Mint(address wallet, uint256 score, uint256
deadline)`, and a `Minted(wallet, tokenId, score)` event.

## Known limit

Diminishing returns slow down spam but do not stop someone running many wallets.
The allowlist and the one-NFT-per-wallet rule are what limit that.

## Open decisions

- Final weights.
- Dust thresholds for swaps and transfers.
- What the starting score counts: all of the wallet's history, or a fixed lookback (for example the last 30 days). A fixed lookback keeps week one from being decided only by old wallets' lifetime history.
- What happens to scores when the next batch starts: restart from a fresh starting score, or carry over. Carrying over lets the same wallets stay on top every week.
- First batch start date.
- Active days: once the scope above is decided, re-check the weight. With a lookback, the count can exceed 7.
- The minimum score to qualify for a reward, and what happens to unpaid amounts.
- Whether the AgenticScore mint itself earns points (suggested: no).
- Which data source the backend reads to classify swaps, mints, and transfers.
- Score delivery at mint: the backend must return the score (for example in a signed voucher) and the mint transaction must expose it (for example in an event). The agent prompt step 7 depends on this, and tells the agent to say so if no score is in the mint result.
