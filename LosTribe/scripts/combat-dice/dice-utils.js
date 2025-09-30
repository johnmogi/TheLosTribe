// Utility functions for the LosTribe elemental dice system.
// These functions are pure and suitable for unit testing.

const ELEMENTS = ['fire', 'air', 'earth', 'water'];

class RNG {
  constructor(seed = Date.now()) {
    this.seed = seed >>> 0;
  }

  next() {
    // xorshift32
    let x = this.seed;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.seed = x >>> 0;
    return this.seed / 0xffffffff;
  }

  pick(arr) {
    const index = Math.floor(this.next() * arr.length);
    return arr[index];
  }
}

function roll3Elements(rng = new RNG()) {
  return [rng.pick(ELEMENTS), rng.pick(ELEMENTS), rng.pick(ELEMENTS)];
}

function tally(pool) {
  return pool.reduce((acc, elem) => {
    acc[elem] = (acc[elem] || 0) + 1;
    return acc;
  }, {});
}

function detectPattern(pool) {
  if (pool.length !== 3) {
    throw new Error('Pattern detection expects exactly 3 dice.');
  }

  const counts = tally(pool);
  const unique = Object.keys(counts).length;

  if (unique === 1) {
    return { pattern: 'triple', element: pool[0], counts };
  }
  if (unique === 2) {
    const [primary, secondary] = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return {
      pattern: 'pair',
      pairElement: primary[0],
      singleElement: secondary[0],
      counts,
    };
  }
  return { pattern: 'distinct', counts };
}

function checkAndConsumeDice(pool, requirement) {
  if (!requirement) return { ok: true, pool: [...pool] };
  const { element, count } = requirement;
  const available = pool.filter(v => v === element).length;
  if (available < count) {
    return { ok: false, pool: [...pool] };
  }
  let removed = 0;
  const remaining = [];
  for (const die of pool) {
    if (die === element && removed < count) {
      removed += 1;
      continue;
    }
    remaining.push(die);
  }
  return { ok: true, pool: remaining };
}

function hasSynergy(pool, requirement) {
  if (!requirement) return false;
  const { element, count } = requirement;
  return pool.filter(v => v === element).length >= count;
}

const BEATS = {
  fire: 'air',
  air: 'earth',
  earth: 'water',
  water: 'fire',
};

function elementMultiplier(attackerElement, defenderAffinity) {
  if (!attackerElement || !defenderAffinity) return 1.0;
  if (attackerElement === defenderAffinity) return 1.0;
  if (BEATS[attackerElement] === defenderAffinity) return 1.15;
  if (BEATS[defenderAffinity] === attackerElement) return 0.85;
  return 1.0;
}

module.exports = {
  ELEMENTS,
  RNG,
  roll3Elements,
  tally,
  detectPattern,
  checkAndConsumeDice,
  hasSynergy,
  elementMultiplier,
};
