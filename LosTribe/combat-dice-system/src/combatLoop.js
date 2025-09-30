const {
    RNG,
    roll3Elements,
    detectPattern,
    resolveCard,
    elementMultiplier
} = require('./diceEngine');

function createHero() {
    return {
        name: 'Nomad',
        hp: 45,
        maxHp: 45,
        def: 0,
        energy: 3,
        maxEnergy: 3,
        elementAffinity: 'earth',
        hand: [
            {
                id: 'c_basic_strike',
                name: 'Basic Strike',
                energyCost: 1,
                element: 'earth',
                baseDamage: 6,
                diceSynergy: null,
                diceCost: null
            },
            {
                id: 'c_flare',
                name: 'Flare',
                energyCost: 1,
                element: 'fire',
                baseDamage: 6,
                diceSynergy: {
                    if: { element: 'fire', count: 1 },
                    bonusDamage: 3
                },
                diceCost: { element: 'fire', count: 1 }
            }
        ]
    };
}

function createMonster() {
    return {
        id: 'm_mirage_jackal',
        name: 'Mirage Jackal',
        hp: 30,
        maxHp: 30,
        def: 1,
        energy: 2,
        maxEnergy: 2,
        elementAffinity: 'air',
        intent: { type: 'attack', element: 'air', value: 8, name: 'Gust Swipe' }
    };
}

function patternContextFromRoll(patternResult) {
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

function dominantElementFromPattern(patternResult, pool) {
    if (patternResult.pattern === 'triple') return patternResult.element;
    if (patternResult.pattern === 'pair') return patternResult.pairElement;
    if (patternResult.pattern === 'distinct') return null;
    return pool[0] || null;
}

function resolveClash(heroElement, monsterElement) {
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

function heroAction(state, heroDicePool, patternContext, clashOutcome) {
    const { hero, monster, log } = state;
    let dicePool = [...heroDicePool];
    let monsterShield = clashOutcome.monsterShield;

    for (const card of hero.hand) {
        if (hero.energy <= 0 || monster.hp <= 0) break;

        const result = resolveCard({
            card,
            actor: hero,
            target: monster,
            dicePool,
            log,
            clashMultiplier: clashOutcome.heroMultiplier,
            patternContext,
            targetShield: monsterShield
        });

        dicePool = result.dicePool;
        monsterShield = result.shieldRemaining;

        if (monster.hp <= 0) {
            log.push(`${monster.name} is defeated!`);
            break;
        }
    }

    return { dicePool, monsterShield };
}

function monsterAction(state, monsterDicePool, patternContext, clashOutcome) {
    const { hero, monster, log } = state;
    if (monster.hp <= 0) {
        log.push(`${monster.name} is down and cannot act.`);
        return { dicePool: monsterDicePool, heroShield: clashOutcome.heroShield };
    }

    let dicePool = [...monsterDicePool];
    let heroShield = clashOutcome.heroShield;

    const dominantElement = patternContext.tripleElement || patternContext.pairElement || monster.intent.element || 'neutral';

    const monsterCard = {
        id: `intent_${monster.intent.type}`,
        name: monster.intent.name || monster.intent.type,
        energyCost: 0,
        element: dominantElement,
        baseDamage: monster.intent.value,
        diceSynergy: null,
        diceCost: null
    };

    monster.energy = monster.maxEnergy;

    const result = resolveCard({
        card: monsterCard,
        actor: monster,
        target: hero,
        dicePool,
        log,
        clashMultiplier: clashOutcome.monsterMultiplier,
        patternContext,
        targetShield: heroShield
    });

    dicePool = result.dicePool;
    heroShield = result.shieldRemaining;

    return { dicePool, heroShield };
}

function runSingleTurn(options = {}) {
    const seed = options.seed || Date.now();
    const rng = new RNG(seed);
    const log = [];

    const hero = options.hero || createHero();
    const monster = options.monster || createMonster();

    log.push(`=== Turn start (seed ${seed}) ===`);

    const heroDice = roll3Elements(rng);
    const monsterDice = roll3Elements(rng);

    const heroPattern = detectPattern(heroDice);
    const monsterPattern = detectPattern(monsterDice);

    const heroPatternContext = patternContextFromRoll(heroPattern);
    const monsterPatternContext = patternContextFromRoll(monsterPattern);

    hero.energy = hero.maxEnergy + (heroPatternContext.energyBonus || 0);
    monster.energy = monster.maxEnergy + (monsterPatternContext.energyBonus || 0);

    const heroElement = dominantElementFromPattern(heroPattern, heroDice);
    const monsterElement = dominantElementFromPattern(monsterPattern, monsterDice);

    log.push(`Hero dice: [${heroDice.join(', ')}] (${heroPattern.pattern})`);
    log.push(`Monster dice: [${monsterDice.join(', ')}] (${monsterPattern.pattern})`);

    const clashOutcome = resolveClash(heroElement, monsterElement);
    log.push(`Clash: ${clashOutcome.summary} → initiative ${clashOutcome.initiative}`);

    const state = {
        hero,
        monster,
        log,
        heroDice,
        monsterDice,
        clashOutcome
    };

    const heroFirst = clashOutcome.initiative === 'hero';

    if (heroFirst) {
        const heroResult = heroAction(state, heroDice, heroPatternContext, clashOutcome);
        state.heroDiceRemaining = heroResult.dicePool;
        clashOutcome.monsterShield = heroResult.monsterShield;

        const monsterResult = monsterAction(state, monsterDice, monsterPatternContext, clashOutcome);
        state.monsterDiceRemaining = monsterResult.dicePool;
        clashOutcome.heroShield = monsterResult.heroShield;
    } else {
        const monsterResult = monsterAction(state, monsterDice, monsterPatternContext, clashOutcome);
        state.monsterDiceRemaining = monsterResult.dicePool;
        clashOutcome.heroShield = monsterResult.heroShield;

        const heroResult = heroAction(state, heroDice, heroPatternContext, clashOutcome);
        state.heroDiceRemaining = heroResult.dicePool;
        clashOutcome.monsterShield = heroResult.monsterShield;
    }

    log.push(`Hero HP: ${hero.hp}/${hero.maxHp}`);
    log.push(`${monster.name} HP: ${monster.hp}/${monster.maxHp}`);

    return state;
}

module.exports = {
    runSingleTurn,
    createHero,
    createMonster,
    patternContextFromRoll,
    dominantElementFromPattern,
    resolveClash
};
