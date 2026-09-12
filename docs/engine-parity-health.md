# Engine parity and market health

Python `newera/engine.py` is the production authority. TypeScript is diagnostic.
No prediction formula or prediction weight update rule was tuned in this change.

## Audit (11 September 2026)

Inspected production main at backend `217bccaf44e91979a499450e4219bbdba9a720ec`
and frontend `8df5876d5fc9f867fd38adcc83906006eae734fe`.
Six deterministic synthetic histories exercise leading zeros, consecutive duplicate
draws, twins, no Markov signal, tie ordering, the rolling weight threshold and persisted
calibration over successive draws. They are software correctness fixtures, not performance evidence.

22 snapshots run in two modes (44 comparisons):

- Shared state: both engines receive the exact same Python previous prediction.
- Independent lifecycle: both start from the same history, then carry their own state.

| Component | Shared state divergent snapshots | Independent lifecycle divergent snapshots |
| --- | ---: | ---: |
| AI rankings | 0/22 | 0/22 |
| AI tier digits | 0/22 | 0/22 |
| AI method weights | 0/22 | 0/22 |
| BBFS digits (order included) | 4/22 | 6/22 |
| BBFS factor weights | 16/22 | 17/22 |
| Paito outputs/distributions | 22/22 | 22/22 |
| Calibration status | 10/22 | 10/22 |
| Dead digits | 0/22 | 0/22 |

Causes established from the code:

- `generatePrediction` in TypeScript only applies custom BBFS weights on FREEZE;
  Python also carries the calibrated factor weights into the next prediction.
- Python Paito uses decayed history frequencies and its biji target implementation;
  TypeScript Paito uses the movement engine's targets and confidence distributions.
- The diagnostic calibrator can label a twin TWIN_PROTECTED while still scoring it
  LOSE. Python's non-twin lifecycle labels it TWIN_UNPROTECTED. This is measured as
  calibration divergence and is not used for production audits.

An observed match in these fixtures is not proof of equivalence on all histories.
No blanket parity claim is made. Numbers use absolute tolerance 1e-8, arrays preserve
order and missing fields count as differences. Reports give per-field values, mismatch
counts/rates and numeric deltas. Snapshots are SHA-256 gated after rounding numeric
serialization to 8 decimal places for reproducibility.

## Reproduce

With sibling `newera` and `newera-web` checkouts:

```sh
pip install -r ../newera/requirements-dev.txt
npm ci
npm test
npm run parity -- --backend ../newera
npm run build
npm run lint
```

`work/parity-report.json` includes the full divergence report. CI uploads this report.
`--require-parity` additionally fails on any divergence, including the acknowledged
differences above. The normal CI gate detects changes to the reviewed snapshot
baseline; a passing regression gate does not mean Python/TypeScript parity.
`--record-baseline` is an explicit maintenance operation: inspect differences and
review the baseline change in a PR; never use it to make a failing CI pass blindly.
CI checks out a pinned partner revision so changes in the other repository cannot
silently alter the result; update the partner pin when the cross-repo contract changes.

## Runtime health

Every fetched market has state integrity checked, and parity is computed before the
server overlay, holding the current history and persisted weights constant. Runtime
checks cover forward outputs; transition/calibration parity is tested in the fixtures.
Legacy documents without full AI rankings omit that comparison rather than invent data.

Precedence: ERROR > DRIFT > STALE > HEALTHY. The full check list remains visible so a
DRIFT badge does not conceal a stale source. Health is not evidence of prediction edge.

- HEALTHY: checked metadata, counters and state agree.
- STALE: missing/behind state, cache/offline, pending zero-live migration, or no scraper
  check in 26 hours (12-hour schedule, two attempts plus grace). This is pipeline
  freshness, not proof that an upstream source published its latest draw.
- DRIFT: unsupported engine/evaluator version, conflicting basis, quarantined history
  correction, clock skew, or different diagnostic output.
- ERROR: malformed predictions, inconsistent accumulators/published metrics, or
  a reported scrape/sync failure.

Prediction state requires exact versions/basis and structurally valid digits, weights,
Paito probabilities and persisted line sets. An invalid/missing/stale production source
returns no production prediction; the local engine is never silently promoted. UI and
share text label diagnostics such as movement, AI confidence and reconstructed timeline.
Production Paito/AI/BBFS and dead digits come from Firestore. Wilson CI evidence and
the 30-live-draw early-sample gate remain intact. Malformed evaluation metrics are withheld.

Read-only Firestore audit on 11 September found all 75 markets still had zero live
draws and lacked the newly introduced live-only bucket. The backend migrates only this
validated zero-live legacy shape, preserving replay metrics. Positive live counters
without a live-only bucket are errors. The web keeps valid legacy replay metrics visible
with a pending-migration status. No Firestore data was changed during this audit.

## Recovery and rollout

Backend first, then frontend is the preferred order. Existing v2 predictions remain
compatible; `tier_ranked_digits` is additive metadata, not an engine formula change.
The next successful scraper run migrates zero-live states and persists health per market.
The scraper workflow also uploads a complete health report and fails on ERROR.

Unobserved multi-draw batches are not counted as prospective observations; previous
metrics survive and `unscored_draws` records the gap. Corrections retain the evaluator
and set `evaluation_blocked_reason`. A corrupt or incompatible evaluator is never
automatically replayed over existing evidence. Recovery requires preserving the original
state for audit and explicitly deciding which observations remain valid; clearing the
quarantine without that audit is unsafe. This PR intentionally does not automate that
destructive recovery. No production merge/deployment is performed by the parity scripts.
