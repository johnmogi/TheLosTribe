// Elemental dice engine core for LosTribe combat prototype.
// Provides deterministic RNG, dice helpers, and basic card resolution.

const ELEMENTS = ['fire', 'air', 'earth', 'water'];

class RNG {
    constructor(seed = Date.now()) {
        this.seed = seed >>> 0;
    }

    next() {
        // xorshift32 implementation for reproducible pseudo-random numbers
        let x = this.seed;
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        this.seed = x >>> 0;
        return this.seed / 0xffffffff;
    }

    pick(array) {
        return array[Math.floor(this.next() * array.length)];
    }
}

function roll3Elements(rng = new RNG()) {
    return [rng.pick(ELEMENTS), rng.pick(ELEMENTS), rng.pick(ELEMENTS)];
}

function tallyDice(pool) {
    return pool.reduce((acc, elem) => {
        acc[elem] = (acc[elem] || 0) + 1;
        return acc;
    }, {});
}

function detectPattern(pool) {
    if (pool.length !== 3) throw new Error('detectPattern expects exactly 3 dice');
    const counts = tallyDice(pool);
    const uniques = Object.keys(counts).length;

    if (uniques === 1) {
        return { pattern: 'triple', element: pool[0], counts };
    }

    if (uniques === 2) {
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return {
            pattern: 'pair',
            pairElement: sorted[0][0],
            singleElement: sorted[1][0],
            counts
        };
    }

    return { pattern: 'distinct', counts };
}

function checkAndConsumeDice(pool, requirement) {
    if (!requirement) return { ok: true, pool: [...pool] };
    const { element, count } = requirement;
    const available = pool.filter(die => die === element).length;
    if (available < count) return { ok: false, pool: [...pool] };

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
    return pool.filter(die => die === element).length >= count;
}

const BEATS = {
    fire: 'air',
    air: 'earth',
    earth: 'water',
    water: 'fire'
};

function elementMultiplier(attackerElement, defenderAffinity) {
    if (!attackerElement || attackerElement === 'neutral' || !defenderAffinity) {
        return 1.0;
    }
    if (attackerElement === defenderAffinity) return 1.0;
    if (BEATS[attackerElement] === defenderAffinity) return 1.5;
    if (BEATS[defenderAffinity] === attackerElement) return 0.5;
    return 1.0;
}

function resolveCard({
    card,
    actor,
    target,
    dicePool,
    log,
    clashMultiplier = 1.0,
    patternContext = {},
    targetShield = 0
}) {
    const poolBeforePlay = [...dicePool];

    if (card.energyCost > actor.energy) {
        log.push(`${actor.name} lacks energy for ${card.name}`);
        return {
            dicePool,
            damage: 0,
            mitigatedDamage: 0,
            shieldRemaining: targetShield
        };
    }

    let poolAfterCost = [...dicePool];
    let costPaid = true;

    if (card.diceCost) {
        const result = checkAndConsumeDice(poolAfterCost, card.diceCost);
        if (!result.ok) {
            costPaid = false;
            poolAfterCost = [...dicePool];
        } else {
            poolAfterCost = result.pool;
        }
    }

    actor.energy -= card.energyCost;

    let damage = card.baseDamage;

    if (card.diceSynergy && hasSynergy(poolBeforePlay, card.diceSynergy.if)) {
        damage += card.diceSynergy.bonusDamage;
    }

    if (patternContext.pairElement && card.element === patternContext.pairElement) {
        damage += patternContext.pairBonus || 0;
    }

    if (patternContext.tripleElement && !patternContext.tripleConsumed && card.element === patternContext.tripleElement) {
        damage += patternContext.tripleBonus || 0;
        patternContext.tripleConsumed = true;
    }

    if (patternContext.distinctBonus && !patternContext.distinctConsumed) {
        damage += patternContext.distinctBonus;
        patternContext.distinctConsumed = true;
    }

    damage = Math.floor(damage * clashMultiplier);

    const element = card.element === 'neutral' ? null : card.element;
    const elementalMultiplier = elementMultiplier(element, target.elementAffinity);
    const rawDamage = Math.max(0, Math.floor((damage - target.def) * elementalMultiplier));

    const mitigatedDamage = Math.max(0, rawDamage - targetShield);
    const shieldRemaining = Math.max(0, targetShield - rawDamage);
    target.hp = Math.max(0, target.hp - mitigatedDamage);

    if (!costPaid && card.diceCost) {
        log.push(`${actor.name} plays ${card.name} without required dice (${card.diceCost.element} x${card.diceCost.count}) → base effect only.`);
    }

    log.push(`${actor.name} plays ${card.name} → ${mitigatedDamage} dmg (raw ${rawDamage}, shield blocked ${rawDamage - mitigatedDamage}, clash x${clashMultiplier.toFixed(2)}, element x${elementalMultiplier.toFixed(2)})`);

    return {
        dicePool: poolAfterCost,
        damage: rawDamage,
        mitigatedDamage,
        shieldRemaining
    };
}

module.exports = {
    ELEMENTS,
    RNG,
    roll3Elements,
    detectPattern,
    checkAndConsumeDice,
    hasSynergy,
    elementMultiplier,
    resolveCard
};
