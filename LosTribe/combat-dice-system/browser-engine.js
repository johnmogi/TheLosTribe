export const ELEMENTS = ['fire', 'air', 'earth', 'water'];

export class RNG {
    constructor(seed = Date.now()) {
        this.seed = seed >>> 0;
    }

    next() {
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

export function roll3Elements(rng = new RNG()) {
    return [rng.pick(ELEMENTS), rng.pick(ELEMENTS), rng.pick(ELEMENTS)];
}

export function tallyDice(pool) {
    return pool.reduce((acc, elem) => {
        acc[elem] = (acc[elem] || 0) + 1;
        return acc;
    }, {});
}

export function detectPattern(pool) {
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

export function checkAndConsumeDice(pool, requirement) {
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

export function hasSynergy(pool, requirement) {
    if (!requirement) return false;
    const { element, count } = requirement;
    return pool.filter(die => die === element).length >= count;
}

export const BEATS = {
    fire: 'air',
    air: 'earth',
    earth: 'water',
    water: 'fire'
};

export function elementMultiplier(attackerElement, defenderAffinity) {
    if (!attackerElement || attackerElement === 'neutral' || !defenderAffinity) {
        return 1.0;
    }
    if (attackerElement === defenderAffinity) return 1.0;
    if (BEATS[attackerElement] === defenderAffinity) return 1.5;
    if (BEATS[defenderAffinity] === attackerElement) return 0.5;
    return 1.0;
}

export function patternContextFromRoll(patternResult) {
    const context = { pattern: patternResult.pattern };

    switch (patternResult.pattern) {
        case 'triple':
            context.tripleElement = patternResult.element;
            context.tripleBonus = 8;
            break;
        case 'pair':
            context.pairElement = patternResult.pairElement;
            context.pairBonus = 4;
            break;
        case 'distinct':
            context.distinctBonus = 2;
            context.energyBonus = 1;
            break;
        default:
            break;
    }

    return context;
}

export function dominantElementFromPattern(patternResult, pool) {
    if (patternResult.pattern === 'triple') return patternResult.element;
    if (patternResult.pattern === 'pair') return patternResult.pairElement;
    if (patternResult.pattern === 'distinct') return null;
    return pool[0] || null;
}

export function resolveClash(heroElement, monsterElement) {
    const outcome = {
        heroMultiplier: 1.0,
        monsterMultiplier: 1.0,
        heroShield: 0,
        monsterShield: 0,
        initiative: 'hero',
        summary: 'No dominant elements'
    };

    if (heroElement && monsterElement) {
        const heroAdvantage = elementMultiplier(heroElement, monsterElement);
        const monsterAdvantage = elementMultiplier(monsterElement, heroElement);

        if (heroAdvantage > monsterAdvantage) {
            outcome.heroMultiplier = 1.5;
            outcome.monsterMultiplier = 0.5;
            outcome.heroShield = 2;
            outcome.initiative = 'hero';
            outcome.summary = `${heroElement.toUpperCase()} overwhelms ${monsterElement.toUpperCase()}`;
        } else if (monsterAdvantage > heroAdvantage) {
            outcome.heroMultiplier = 0.5;
            outcome.monsterMultiplier = 1.5;
            outcome.monsterShield = 2;
            outcome.initiative = 'monster';
            outcome.summary = `${monsterElement.toUpperCase()} overwhelms ${heroElement.toUpperCase()}`;
        } else {
            outcome.summary = `${heroElement.toUpperCase()} clashes evenly with ${monsterElement.toUpperCase()}`;
        }
    } else if (heroElement && !monsterElement) {
        outcome.heroMultiplier = 1.25;
        outcome.heroShield = 1;
        outcome.initiative = 'hero';
        outcome.summary = `Hero attunes to ${heroElement.toUpperCase()} (initiative)`;
    } else if (!heroElement && monsterElement) {
        outcome.monsterMultiplier = 1.25;
        outcome.monsterShield = 1;
        outcome.initiative = 'monster';
        outcome.summary = `Monster attunes to ${monsterElement.toUpperCase()} (initiative)`;
    }

    return outcome;
}

export function resolveCard({
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
