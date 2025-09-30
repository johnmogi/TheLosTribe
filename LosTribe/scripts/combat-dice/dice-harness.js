#!/usr/bin/env node
/* eslint-disable no-console */
const { argv } = require('node:process');
const { RNG, roll3Elements, detectPattern, elementMultiplier, checkAndConsumeDice, hasSynergy } = require('./dice-utils');

function parseArgs() {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    switch (key) {
      case '--samples':
        args.samples = Number(next);
        i += 1;
        break;
      case '--seed':
        args.seed = Number(next);
        i += 1;
        break;
      case '--force':
        args.force = next.split(',').map(s => s.trim());
        i += 1;
        break;
      default:
        break;
    }
  }
  return args;
}

function simulate({ samples = 10000, seed = Date.now(), force = null }) {
  const rng = new RNG(seed);
  const counts = { triple: 0, pair: 0, distinct: 0 };

  for (let i = 0; i < samples; i += 1) {
    const pool = force ? force : roll3Elements(rng);
    const { pattern } = detectPattern(pool);
    counts[pattern] += 1;
  }

  console.log(`Samples: ${samples}`);
  console.log(`Seed:    ${seed}`);
  console.log('Pattern distribution:');
  Object.entries(counts).forEach(([pattern, count]) => {
    const pct = ((count / samples) * 100).toFixed(2);
    console.log(`  ${pattern.padEnd(8)} ${count.toString().padStart(7)} (${pct}%)`);
  });

  console.log('\nSample interactions:');
  const testPool = force || roll3Elements(new RNG(seed + 1));
  console.log(`  Dice pool: [${testPool.join(', ')}]`);
  const costCheck = checkAndConsumeDice(testPool, { element: 'fire', count: 2 });
  console.log(`  Consume 2 fire dice -> ok: ${costCheck.ok} | remaining: [${costCheck.pool.join(', ')}]`);
  console.log(`  Synergy (air ≥ 1): ${hasSynergy(testPool, { element: 'air', count: 1 })}`);
  console.log(`  Multiplier fire vs air: ${elementMultiplier('fire', 'air')}`);
  console.log(`  Multiplier fire vs water: ${elementMultiplier('fire', 'water')}`);
}

if (require.main === module) {
  try {
    const args = parseArgs();
    simulate(args);
  } catch (error) {
    console.error('Harness error:', error);
    process.exitCode = 1;
  }
}
