# Combat Dice Test Harness

This folder contains tooling to validate the elemental dice combat system.

## Files
- `dice-utils.js` – Pure functions for dice rolling, pattern detection, and cost/synergy helpers.
- `dice-harness.js` – CLI-friendly runner to simulate dice rolls, validate probabilities, and smoke-test helpers.

## Usage
Run the harness with Node:
```bash
node scripts/combat-dice/dice-harness.js --samples 100000 --seed 42
```

Flags:
- `--samples <n>`: number of dice rolls to simulate (default 10000).
- `--seed <n>`: RNG seed for reproducible runs (default Date.now()).
- `--force <csv>`: Optional comma-separated dice string (e.g., `fire,air,earth`) to bypass random rolls for testing helpers.

The script prints distribution summaries and validation checks for triple/pair/distinct rates, plus sample card interactions.
