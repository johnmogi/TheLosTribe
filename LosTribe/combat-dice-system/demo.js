#!/usr/bin/env node
/* eslint-disable no-console */
const { runSingleTurn } = require('./src/combatLoop');

function main() {
    const seedArgIndex = process.argv.indexOf('--seed');
    const seed = seedArgIndex !== -1 ? Number(process.argv[seedArgIndex + 1]) : Date.now();

    const state = runSingleTurn({ seed });

    console.log(state.log.join('\n'));
}

if (require.main === module) {
    main();
}
