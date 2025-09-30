# LosTribe Elemental Dice Combat System

## Purpose
Create an implementation-ready blueprint for the refreshed combat loop featuring elemental dice. This document targets engineers integrating the new mechanics into the backend and demo clients.

---

## Design Goals
- **Readable:** Dice outcomes are visible, predictable, and meaningful.
- **Strategic:** Dice are resources manipulated by cards/relics rather than pure RNG.
- **Symmetric:** Heroes and monsters both roll dice; encounters remain authorable.
- **Transcendent Theme:** Dice + tarot synergies trigger evolution moments.

---

## Core Vocabulary
- **Elements:** `fire`, `air`, `earth`, `water`.
- **Dice:** Each actor rolls **3 Elemental Dice** at the start of its turn. Faces are the four elements above.
- **Dice Pool:** Array of that actor’s current dice (e.g., `["fire","air","air"]`). Dice are consumed by effects or expire at end of turn.
- **Card:** Energy cost, primary effect, optional `dice_cost`, `dice_synergy`, `fuse`, `manip` fields.
- **Monster Intent:** Declared action for the upcoming monster turn; optionally tagged with an element.
- **Elemental RPS:** Advantage loop (`fire → air → earth → water → fire`). Wins = +15% damage, losses = −15%.
- **Combination:** Two/three-die patterns unlock special fusions or resonance buffs.

---

## Turn Structure (Player Focus)
1. **Start Turn**
   - Refill energy, draw to hand limit.
   - `playerDice = roll3ElementalDice(seed)`.
   - Resolve start-of-turn status (tarot relics, buffs).
2. **Action Phase**
   - Player plays cards until ending turn or running out of energy.
   - Cards can consume or check dice. Optional re-roll mechanics consume separate resources.
3. **End Turn**
   - Unused dice expire unless banked by relics.
   - Queue player status effects on monsters.
4. **Monster Turn**
   - For each active monster (or monster group): roll `monsterDice`, resolve intent, apply damage/defense using the same RPS multipliers.

Repeat until victory/defeat triggers, including tarot evolution checks.

---

## Dice Rules
- **Count:** 3 dice per actor per turn, always.
- **Faces:** Uniform distribution over four elements.
- **Visibility:** Player sees their dice immediately. Monster dice may stay hidden until resolution; monster intent shows expected element icon.
- **Consumption:** Dice removed from the pool when effects require them. Synergy checks do **not** consume dice.
- **Manipulation:** Cards/relics can re-roll, bank, swap, or steal dice. Provide admin hooks for QA (see Debugging section).

### Pattern Probabilities (3 dice, 4 elements)
| Pattern | Probability | Notes |
|---------|-------------|-------|
| Triple (AAA) | 4/64 = **6.25%** | Rare; justify large fusion effects |
| Pair + Single (AAB) | 36/64 = **56.25%** | Common; moderate bonuses |
| All Distinct (ABC) | 24/64 = **37.5%** | Resonance reward |

### Suggested Pattern Effects
- **Triple X:** Consume all 3 → "Ult" effect (e.g., Triple Fire = Inferno DoT).
- **Pair X + Y:** Primary element gets a bonus (e.g., Fire + Earth = Magma armor-penetration) plus the single element’s side-effect.
- **Three Distinct:** Harmony/Resonance → +1 tarot charge, +1 energy next turn, or similar light buff.

---

## Elemental Advantage Table
```
fire  > air   (attacker fire beats defender air)
air   > earth
earth > water
water > fire
```
- **Advantage Multiplier:** `1.15`
- **Disadvantage Multiplier:** `0.85`
- **Neutral Multiplier:** `1.0`

Apply to `(baseDamage - defense)` before flooring to integer. Extend for defense buffs, DoTs, etc.

---

## Card & Dice Integration
- **`dice_cost`:** Consume dice on play. Example `{ "element": "fire", "count": 2 }` requires removing two fire dice.
- **`dice_synergy`:** Check-only bonuses. Example `{ "if": {"element":"air","count":1}, "bonus": {"damage":3} }`.
- **`fuse`:** Named pair/triple patterns unlocking custom payloads.
- **`manip`:** Actions that reroll, bank, or swap dice.
- **`tarot_charge`:** Earned via Resonance; spent by evolution cards.

### Example Card JSON
```json
{
  "id": "c_flare",
  "name": "Flare",
  "cost": 1,
  "element": "fire",
  "base": { "type": "attack", "value": 6 },
  "dice_synergy": {
    "if": { "element": "fire", "count": 1 },
    "bonus": { "damage": 3 }
  },
  "dice_cost": { "element": "fire", "count": 1 },
  "fuse": {
    "triple": {
      "effect": "inferno",
      "desc": "Consume triple fire to deal 12 AoE Burn"
    }
  }
}
```

---

## Monster Intents & AI
- **Intent Schema:** `{ "type": "attack", "element": "air", "value": 8, "probability": 0.7 }`.
- **Dice:** Monsters roll 3 dice when their turn starts or per intent. Matching element grants bonuses (damage, status, summons).
- **AI Archetypes:**
  - *Attacker:* Burns dice to increase direct damage.
  - *Controller:* Uses combos to stun or reposition.
  - *Summoner:* Consumes pairs to spawn adds.
- **Reactive Behavior:** Monsters may pivot intents if players repeatedly exploit certain elements.

---

## Data Schemas
### Dice State
```json
{
  "dicePool": ["fire", "air", "air"],
  "diceHistory": [
    { "turn": 2, "actor": "player", "roll": ["fire","air","air"], "seed": 12345 }
  ]
}
```

### Monster Schema
```json
{
  "id": "m_mirage_jackal",
  "name": "Mirage Jackal",
  "hp": 22,
  "atk": 6,
  "def": 1,
  "spd": 8,
  "element_affinity": "air",
  "ai_type": "attacker",
  "intents": [
    { "type": "attack", "element": "air", "value": 6, "probability": 0.7 },
    { "type": "dodge", "element": "earth", "value": 0, "probability": 0.3 }
  ]
}
```

### Runtime Combat State
```json
{
  "turn": 3,
  "phase": "player_action",
  "player": { "hp": 45, "energy": 2, "hand": [...], "deck": [...] },
  "monsters": [ /* monster objects */ ],
  "playerDice": ["fire","air","water"],
  "monsterDice": { "m1": ["air","air","earth"] }
}
```

---

## Core Algorithms (Pseudocode)
```js
function roll3Elements(rng) {
  const faces = ['fire','air','earth','water'];
  return [rng.pick(faces), rng.pick(faces), rng.pick(faces)];
}

function checkAndConsumeDice(pool, requirement) {
  const { element, count } = requirement;
  const available = pool.filter(die => die === element).length;
  if (available < count) return { ok: false };

  let removed = 0;
  const remaining = [];
  for (const die of pool) {
    if (die === element && removed < count) { removed++; continue; }
    remaining.push(die);
  }
  return { ok: true, pool: remaining };
}

function elementMultiplier(attackerElement, defenderAffinity) {
  const beats = { fire: 'air', air: 'earth', earth: 'water', water: 'fire' };
  if (!attackerElement || attackerElement === defenderAffinity) return 1.0;
  if (beats[attackerElement] === defenderAffinity) return 1.15;
  if (beats[defenderAffinity] === attackerElement) return 0.85;
  return 1.0;
}

function playCard(card, actor, target, state, rng) {
  if (card.dice_cost) {
    const check = checkAndConsumeDice(state.playerDice, card.dice_cost);
    if (!check.ok) { log('Not enough dice'); return; }
    state.playerDice = check.pool;
  }

  let damage = card.base.value;
  if (card.dice_synergy) {
    const { element, count } = card.dice_synergy.if;
    const bonus = state.playerDice.filter(e => e === element).length >= count;
    if (bonus) damage += card.dice_synergy.bonus.damage;
  }

  const mult = elementMultiplier(card.element, target.element_affinity);
  const final = Math.max(0, Math.floor((damage - target.def) * mult));
  target.hp -= final;
  log(`${actor.name} plays ${card.name} -> ${final} damage (${mult}x)`);
}
```

Add helpers for pattern detection (`detectTriple`, `detectPair`, `detectDistinct`) and fusion dispatch.

---

## Debugging & QA Requirements
- **Seeded RNG:** Ability to replay identical battles using a fixed seed.
- **Force Dice Admin UI:** Override dice rolls for QA.
- **Dice Timeline:** Track last N rolls and consumption history.
- **Combat Replay:** Step through turns with logged actions.
- **Unit Tests:** Validate dice distributions (100k simulations), combo detection, elemental multipliers, dice consumption/refunds.
- **Balance Knobs:** Advantage multipliers, card costs, fusion effects in config files.

---

## Implementation Milestones
1. **Sprint 1 – Backend Core (1–2 weeks)**
   - Seeded RNG + `roll3Elements`.
   - Dice pool object + admin hooks.
   - Card engine (energy, play, dice cost/synergy).
   - Monster intents + one AI archetype.
2. **Sprint 2 – Combat Loop (1–2 weeks)**
   - Full player/monster turn flow with dice integration.
   - Pair/triple/distinct detection + fusion handlers.
   - Logging, replay, unit tests for dice distribution.
3. **Sprint 3 – Content & Integration (1–2 weeks)**
   - Tarot trigger (Resonance charge) integration.
   - Load starter card/monster/relic packs.
   - Balance pass + playtest checklist.

---

## Example Turn Walkthrough
1. Player rolls `["earth","fire","air"]`.
2. Plays `Basic Strike` (neutral element): damage = 6, target def = 1 → `floor(5 * 1.0) = 5`.
3. Plays `Flare` (consumes one fire die). Base 6 + synergy +3 = 9. Fire vs air → `1.15` multiplier → `floor((9-1)*1.15) = 9` damage.
4. Remaining dice expire.

---

## Immediate Action Items
- Integrate this spec into the new backend module.
- Update demo roll function to use only four-element faces.
- Await product decision on next deliverable:
  - **Option A:** Generate starter JSON packs (10 cards, 5 monsters) aligned to this spec.
  - **Option B:** Provide JS module + test harness for dice simulation and pattern stats.
