#!/usr/bin/env node
/* eslint-disable no-console */
const assert = require('node:assert/strict');
const { RNG, roll3Elements, detectPattern } = require('../src/diceEngine');

function simulate(samples = 100000, seed = 12345) {
    const rng = new RNG(seed);
    const counts = { triple: 0, pair: 0, distinct: 0 };

    for (let i = 0; i < samples; i += 1) {
        const roll = roll3Elements(rng);
        const { pattern } = detectPattern(roll);
        counts[pattern] += 1;
    }

    return counts;
}

function main() {
    const samples = Number(process.env.SAMPLES || 100000);
    const seed = Number(process.env.SEED || 12345);
    const counts = simulate(samples, seed);

    const toPct = (count) => (count / samples) * 100;
    const triplePct = toPct(counts.triple);
    const pairPct = toPct(counts.pair);
    const distinctPct = toPct(counts.distinct);

    console.log(`Samples: ${samples}`);
    console.log(`Seed:    ${seed}`);
    console.log(`Triple:   ${triplePct.toFixed(2)}% (expected ~6.25%)`);
    console.log(`Pair:     ${pairPct.toFixed(2)}% (expected ~56.25%)`);
    console.log(`Distinct: ${distinctPct.toFixed(2)}% (expected ~37.50%)`);

    assert(Math.abs(triplePct - 6.25) < 0.5, 'Triple probability drift too high');
    assert(Math.abs(pairPct - 56.25) < 0.5, 'Pair probability drift too high');
    assert(Math.abs(distinctPct - 37.5) < 0.5, 'Distinct probability drift too high');

    console.log('Distribution within tolerance ✅');
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}
