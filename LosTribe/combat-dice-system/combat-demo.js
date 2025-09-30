import {
    RNG,
    roll3Elements,
    detectPattern,
    patternContextFromRoll,
    dominantElementFromPattern,
    resolveClash,
    resolveCard
} from './browser-engine.js';

const rng = new RNG();

const CARD_DEFINITIONS = {
    c_strike: {
        id: 'c_strike',
        name: 'Basic Strike',
        type: 'attack',
        energyCost: 1,
        element: 'earth',
        baseDamage: 6,
        description: 'Deal 6 damage to a single foe.',
        diceSynergy: null,
        diceCost: null
    },
    c_guard: {
        id: 'c_guard',
        name: 'Stone Guard',
        type: 'defense',
        energyCost: 1,
        element: 'earth',
        block: 6,
        description: 'Gain 6 ward this turn.',
        diceSynergy: { if: { element: 'earth', count: 1 }, bonusBlock: 3 },
        diceCost: null
    },
    c_focus: {
        id: 'c_focus',
        name: 'Focus Breath',
        type: 'utility',
        energyCost: 0,
        element: 'air',
        energyGain: 1,
        description: 'Gain 1 energy.',
        diceSynergy: { if: { element: 'air', count: 1 }, bonusEnergy: 1 },
        diceCost: null
    },
    c_lantern: {
        id: 'c_lantern',
        name: 'Lantern Glow',
        type: 'utility',
        energyCost: 2,
        element: 'fire',
        heal: 8,
        description: 'Heal 8 HP.',
        diceSynergy: { if: { element: 'fire', count: 2 }, bonusHeal: 4 },
        diceCost: { element: 'fire', count: 1 }
    },
    c_cyclone: {
        id: 'c_cyclone',
        name: 'Cyclone Slash',
        type: 'attack',
        energyCost: 2,
        element: 'air',
        baseDamage: 10,
        description: 'Deal 10 damage. Pairs love the wind.',
        diceSynergy: { if: { element: 'air', count: 1 }, bonusDamage: 4 },
        diceCost: null
    }
};

const cardMap = new Map(Object.entries(CARD_DEFINITIONS));

const ELEMENT_AFFINITIES = {
    m_mirage_jackal: 'air',
    m_sand_wraith: 'earth',
    m_dust_serpent: 'fire'
};

class ElementalCombatDemo {
    constructor() {
        this.statusEl = document.getElementById('status');
        this.startBtn = document.getElementById('startBtn');
        this.endTurnBtn = document.getElementById('endTurnBtn');
        this.heroHpEl = document.getElementById('hero-hp');
        this.heroEnergyEl = document.getElementById('hero-energy');
        this.heroDefenseEl = document.getElementById('hero-defense');
        this.heroHandEl = document.getElementById('hero-hand');
        this.monsterListEl = document.getElementById('monster-list');
        this.combatLogEl = document.getElementById('combat-log');
        this.drawCountEl = document.getElementById('draw-count');
        this.discardCountEl = document.getElementById('discard-count');
        this.exhaustCountEl = document.getElementById('exhaust-count');
        this.drawListEl = document.getElementById('draw-list');
        this.discardListEl = document.getElementById('discard-list');
        this.exhaustListEl = document.getElementById('exhaust-list');
        this.monsterCountSelect = document.getElementById('monster-count');
        this.showPileCardsCheckbox = document.getElementById('show-pile-cards');
        this.diceLogEl = document.getElementById('dice-log');
        this.heroDiceValuesEl = document.getElementById('hero-dice-values');
        this.heroDicePatternEl = document.getElementById('hero-dice-pattern');
        this.monsterDiceValuesEl = document.getElementById('monster-dice-values');
        this.monsterDicePatternEl = document.getElementById('monster-dice-pattern');
        this.clashSummaryEl = document.getElementById('clash-summary');

        this.currentRunData = null;
        this.hero = null;
        this.monsters = [];
        this.turnState = null;
        this.logEntries = [];
        this.heroHand = [];
        this.heroDrawPile = [];
        this.heroDiscardPile = [];
        this.heroExhaustPile = [];
        this.monsterCount = Number(this.monsterCountSelect.value) || 1;
    }

    init() {
        this.monsterCountSelect.addEventListener('change', (event) => {
            this.monsterCount = Number(event.target.value) || 1;
        });

        this.showPileCardsCheckbox.addEventListener('change', () => {
            const show = this.showPileCardsCheckbox.checked;
            this.drawListEl.hidden = !show;
            this.discardListEl.hidden = !show;
            this.exhaustListEl.hidden = !show;
            this.updatePileDisplays();
        });

        window.generateNewRun = () => this.generateNewRun();
        window.startCombat = () => this.startCombat();
        window.endTurn = () => this.endTurn();

        console.log('⚔️ Combat System Demo ready (elemental dice mode).');
        console.log('🎭 Click "Generate New Run" to begin.');
    }

    generateNewRun() {
        this.currentRunData = this.createMockRun();
        this.statusEl.textContent = 'Run prepared. Ready for combat!';
        this.startBtn.disabled = false;
        this.endTurnBtn.disabled = true;
        this.hero = null;
        this.monsters = [];
        this.logEntries = [];
        this.renderLog();
        this.updateOutOfCombatDisplay();
        this.clearDiceDisplay();
    }

    startCombat() {
        if (!this.currentRunData) return;
        const battleRoom = this.currentRunData.dungeon.allRooms.find(room => room.type === 'battle');
        if (!battleRoom || !battleRoom.monsters || battleRoom.monsters.length === 0) {
            this.statusEl.textContent = 'No monsters to fight!';
            return;
        }

        const heroForCombat = this.prepareHero(this.currentRunData.hero);
        const monstersForCombat = battleRoom.monsters
            .slice(0, Math.max(1, Math.min(this.monsterCount, battleRoom.monsters.length)))
            .map(monster => this.prepareMonster(monster));

        this.hero = heroForCombat;
        this.monsters = monstersForCombat;

        this.heroDrawPile = this.shuffle(heroForCombat.deck.slice());
        this.heroDiscardPile = [];
        this.heroExhaustPile = [];
        this.heroHand = this.drawCards(5);

        this.logEntries = [];
        this.log(`Combat begins in ${battleRoom.tarot} chamber!`);
        this.log(`${heroForCombat.name} faces ${monstersForCombat.length} enemies.`);

        this.statusEl.textContent = 'Combat in progress...';
        this.startBtn.disabled = true;
        this.endTurnBtn.disabled = false;

        this.beginTurn();
        this.renderAll();
    }

    endTurn() {
        if (!this.turnState || !this.turnState.active) return;
        if (this.turnState.monsterActed) {
            this.beginTurn();
        } else {
            this.monsterPhase();
            if (this.hero.hp <= 0 || this.monsters.every(m => m.hp <= 0)) {
                this.finishCombat();
            } else {
                this.beginTurn();
            }
        }
        this.renderAll();
    }

    beginTurn() {
        if (!this.hero || this.hero.hp <= 0) return;
        if (this.monsters.every(monster => monster.hp <= 0)) {
            this.finishCombat('victory');
            return;
        }

        const monster = this.monsters.find(m => m.hp > 0);
        if (!monster) {
            this.finishCombat('victory');
            return;
        }

        const heroDice = roll3Elements(rng);
        const monsterDice = roll3Elements(rng);

        const heroPattern = detectPattern(heroDice);
        const monsterPattern = detectPattern(monsterDice);

        const heroPatternContext = patternContextFromRoll(heroPattern);
        const monsterPatternContext = patternContextFromRoll(monsterPattern);

        this.hero.energy = this.hero.maxEnergy + (heroPatternContext.energyBonus || 0);
        monster.energy = monster.maxEnergy + (monsterPatternContext.energyBonus || 0);

        const heroElement = dominantElementFromPattern(heroPattern, heroDice);
        const monsterElement = dominantElementFromPattern(monsterPattern, monsterDice);

        const clashOutcome = resolveClash(heroElement, monsterElement);

        this.turnState = {
            active: true,
            heroDiceOriginal: heroDice,
            monsterDiceOriginal: monsterDice,
            heroDicePool: [...heroDice],
            monsterDicePool: [...monsterDice],
            heroPatternContext,
            monsterPatternContext,
            clashOutcome,
            heroShield: 0,
            monsterShield: clashOutcome.monsterShield,
            monsterActed: false,
            heroActed: false
        };

        this.log(`Hero dice: [${heroDice.join(', ')}] (${heroPattern.pattern})`);
        this.log(`Monster dice: [${monsterDice.join(', ')}] (${monsterPattern.pattern})`);
        this.log(`Clash outcome: ${clashOutcome.summary}. Initiative: ${clashOutcome.initiative}.`);

        if (clashOutcome.initiative === 'monster') {
            this.monsterPhase();
        }

        this.renderDice();
        this.renderStats();
    }

    monsterPhase() {
        if (!this.turnState || this.turnState.monsterActed) return;
        const monster = this.monsters.find(m => m.hp > 0);
        if (!monster) return;

        const dominantElement = this.turnState.monsterPatternContext.tripleElement
            || this.turnState.monsterPatternContext.pairElement
            || monster.intent.element
            || monster.elementAffinity;

        const monsterCard = {
            id: `intent_${monster.intent.type}`,
            name: monster.intent.name,
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
            target: this.hero,
            dicePool: this.turnState.monsterDicePool,
            log: this.logEntries,
            clashMultiplier: this.turnState.clashOutcome.monsterMultiplier,
            patternContext: this.turnState.monsterPatternContext,
            targetShield: this.turnState.heroShield
        });

        this.turnState.monsterDicePool = result.dicePool;
        this.turnState.heroShield = result.shieldRemaining;
        this.turnState.monsterActed = true;

        if (this.hero.hp <= 0) {
            this.finishCombat('defeat');
        }
    }

    playHeroCard(card, handIndex) {
        if (!this.turnState || this.turnState.monsterActed && this.turnState.clashOutcome.initiative === 'monster') {
            // monster already acted first; hero may still act if alive
        }
        if (!this.hero || this.hero.hp <= 0) return;
        if (this.turnState && !this.turnState.active) return;
        if (this.hero.energy < card.energyCost) {
            this.log(`${this.hero.name} lacks energy for ${card.name}.`);
            this.renderAll();
            return;
        }

        let cardResolved = false;

        if (card.type === 'attack') {
            const target = this.monsters.find(m => m.hp > 0);
            if (!target) {
                this.log('No targets remain.');
                this.renderAll();
                return;
            }
            const result = resolveCard({
                card,
                actor: this.hero,
                target,
                dicePool: this.turnState.heroDicePool,
                log: this.logEntries,
                clashMultiplier: this.turnState.clashOutcome.heroMultiplier,
                patternContext: this.turnState.heroPatternContext,
                targetShield: this.turnState.monsterShield
            });
            this.turnState.heroDicePool = result.dicePool;
            this.turnState.monsterShield = result.shieldRemaining;
            cardResolved = true;
            if (target.hp <= 0) {
                this.log(`${target.name} is defeated!`);
            }
        } else if (card.type === 'defense') {
            let block = card.block || 0;
            if (card.diceSynergy && this.turnState.heroDicePool.filter(e => e === card.diceSynergy.if.element).length >= card.diceSynergy.if.count) {
                block += card.diceSynergy.bonusBlock || 0;
            }
            this.hero.energy -= card.energyCost;
            this.turnState.heroShield += block;
            this.log(`${this.hero.name} raises a ward for ${block} damage.`);
            cardResolved = true;
        } else if (card.type === 'utility') {
            this.hero.energy -= card.energyCost;
            if (card.energyGain) {
                let bonus = 0;
                if (card.diceSynergy && this.turnState.heroDicePool.filter(e => e === card.diceSynergy.if.element).length >= card.diceSynergy.if.count) {
                    bonus = card.diceSynergy.bonusEnergy || 0;
                }
                const gain = card.energyGain + bonus;
                this.hero.energy = Math.min(this.hero.maxEnergy, this.hero.energy + gain);
                this.log(`${this.hero.name} gains ${gain} energy.`);
            }
            if (card.heal) {
                let bonusHeal = 0;
                if (card.diceSynergy && this.turnState.heroDicePool.filter(e => e === card.diceSynergy.if.element).length >= card.diceSynergy.if.count) {
                    bonusHeal = card.diceSynergy.bonusHeal || 0;
                }
                const healAmount = card.heal + bonusHeal;
                this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + healAmount);
                this.log(`${this.hero.name} heals ${healAmount} HP.`);
            }
            cardResolved = true;
        }

        if (cardResolved) {
            if (handIndex >= 0) {
                const [used] = this.heroHand.splice(handIndex, 1);
                if (used) {
                    this.heroDiscardPile.push(used.id);
                }
            }
            this.turnState.heroActed = true;
            this.fillHand();
            if (this.monsters.every(m => m.hp <= 0)) {
                this.finishCombat('victory');
            }
        }

        this.renderAll();
    }

    finishCombat(result) {
        if (!result) {
            result = this.monsters.every(m => m.hp <= 0) ? 'victory' : this.hero.hp <= 0 ? 'defeat' : 'unknown';
        }
        this.turnState = null;
        this.startBtn.disabled = false;
        this.endTurnBtn.disabled = true;
        this.statusEl.textContent = result === 'victory' ? 'Victory! Combat completed.' : 'Defeat! Hero has fallen.';
        this.log(result === 'victory' ? 'Victory! The enemies fall.' : 'Defeat... The hero collapses.');
    }

    renderAll() {
        this.renderStats();
        this.renderDice();
        this.renderMonsters();
        this.renderLog();
        this.updateHandDisplay();
        this.updatePileDisplays();
    }

    renderStats() {
        if (!this.hero) return;
        this.heroHpEl.textContent = `${this.hero.hp}/${this.hero.maxHp}`;
        this.heroEnergyEl.textContent = `${this.hero.energy}/${this.hero.maxEnergy}`;
        this.heroDefenseEl.textContent = this.turnState ? `${this.hero.def} (+${this.turnState.heroShield} ward)` : `${this.hero.def}`;
    }

    renderMonsters() {
        this.monsterListEl.innerHTML = '';
        this.monsters.forEach(monster => {
            const el = document.createElement('div');
            el.className = 'monster-item';
            const intentText = monster.hp > 0 ? `${monster.intent.name} (${monster.intent.element})` : 'Defeated';
            el.innerHTML = `
                <div class="monster-info">
                    <strong>${monster.name}</strong><br>
                    <span class="monster-hp">HP: ${monster.hp}/${monster.maxHp}</span>
                </div>
                <div class="monster-intent">${intentText}</div>
            `;
            this.monsterListEl.appendChild(el);
        });
    }

    renderLog() {
        this.combatLogEl.innerHTML = '';
        const recent = this.logEntries.slice(-12);
        recent.forEach(entry => {
            const div = document.createElement('div');
            div.className = 'log-entry';
            div.textContent = entry;
            this.combatLogEl.appendChild(div);
        });
        this.combatLogEl.scrollTop = this.combatLogEl.scrollHeight;
    }

    renderDice() {
        if (!this.turnState) {
            this.clearDiceDisplay();
            return;
        }
        this.heroDiceValuesEl.textContent = `[${this.turnState.heroDicePool.join(', ') || '—'}]`;
        this.monsterDiceValuesEl.textContent = `[${this.turnState.monsterDicePool.join(', ') || '—'}]`;
        this.heroDicePatternEl.textContent = `${this.turnState.heroPatternContext.pattern} pattern`;
        this.monsterDicePatternEl.textContent = `${this.turnState.monsterPatternContext.pattern} pattern`;
        const shieldInfo = `Hero ward ${this.turnState.heroShield} • Monster ward ${this.turnState.monsterShield}`;
        this.clashSummaryEl.textContent = `${this.turnState.clashOutcome.summary} | ${shieldInfo}`;
        this.diceLogEl.textContent = `Initiative: ${this.turnState.clashOutcome.initiative.toUpperCase()} • Multipliers H ${this.turnState.clashOutcome.heroMultiplier.toFixed(2)} / M ${this.turnState.clashOutcome.monsterMultiplier.toFixed(2)}`;
    }

    clearDiceDisplay() {
        this.heroDiceValuesEl.textContent = '-';
        this.heroDicePatternEl.textContent = 'Roll to begin';
        this.monsterDiceValuesEl.textContent = '-';
        this.monsterDicePatternEl.textContent = 'Roll to begin';
        this.clashSummaryEl.textContent = 'Clash summary appears here.';
        this.diceLogEl.textContent = 'Rolls appear here.';
    }

    updateHandDisplay() {
        this.heroHandEl.innerHTML = '';
        this.heroHand.forEach((card, index) => {
            const cardEl = document.createElement('div');
            const disabled = !this.turnState || this.hero.energy < card.energyCost;
            cardEl.className = `card ${disabled ? 'disabled' : ''}`;
            cardEl.innerHTML = `
                <div class="card-cost">${card.energyCost}</div>
                <strong>${card.name}</strong><br>
                <small>${card.description || ''}</small><br>
                <small>Type: ${card.type}</small>
            `;
            if (!disabled && this.turnState && this.turnState.active) {
                cardEl.onclick = () => this.playHeroCard(card, index);
            }
            this.heroHandEl.appendChild(cardEl);
        });
    }

    updatePileDisplays() {
        this.drawCountEl.textContent = this.heroDrawPile.length;
        this.discardCountEl.textContent = this.heroDiscardPile.length;
        this.exhaustCountEl.textContent = this.heroExhaustPile.length;

        if (!this.showPileCardsCheckbox.checked) return;

        const drawCards = this.heroDrawPile.map(id => this.resolveCardId(id)).filter(Boolean);
        const discardCards = this.heroDiscardPile.map(id => this.resolveCardId(id)).filter(Boolean);
        const exhaustCards = this.heroExhaustPile.map(id => this.resolveCardId(id)).filter(Boolean);

        this.renderPileList(this.drawListEl, drawCards, true);
        this.renderPileList(this.discardListEl, discardCards, false);
        this.renderPileList(this.exhaustListEl, exhaustCards, false);
    }

    renderPileList(container, cards, reverse = false) {
        container.innerHTML = '';
        const entries = reverse ? [...cards].reverse() : cards;
        if (entries.length === 0) {
            container.innerHTML = '<div class="pile-entry">Empty</div>';
            return;
        }
        entries.forEach(card => {
            const row = document.createElement('div');
            row.className = 'pile-entry';
            row.textContent = `${card.name} (cost ${card.energyCost})`;
            container.appendChild(row);
        });
    }

    log(message) {
        this.logEntries.push(message);
    }

    drawCards(count = 1) {
        const cards = [];
        for (let i = 0; i < count; i += 1) {
            if (this.heroDrawPile.length === 0) {
                if (this.heroDiscardPile.length === 0) break;
                this.heroDrawPile = this.shuffle(this.heroDiscardPile.slice());
                this.heroDiscardPile = [];
            }
            const id = this.heroDrawPile.shift();
            const card = this.resolveCardId(id);
            if (card) cards.push({ ...card });
        }
        return cards;
    }

    fillHand() {
        while (this.heroHand.length < 5) {
            const drawn = this.drawCards(1);
            if (drawn.length === 0) break;
            this.heroHand.push(...drawn);
        }
    }

    resolveCardId(id) {
        return cardMap.get(id) || null;
    }

    updateOutOfCombatDisplay() {
        if (!this.currentRunData) return;
        const hero = this.currentRunData.hero;
        this.heroHpEl.textContent = `${hero.stats.hp}/${hero.maxStats.hp}`;
        this.heroEnergyEl.textContent = `${hero.energy}/${hero.maxEnergy}`;
        this.heroDefenseEl.textContent = hero.stats.def;
    }

    createMockRun() {
        const heroBaseStats = { hp: 45, def: 2, maxEnergy: 3 };
        const hero = {
            id: 'h_nomad',
            name: 'Nomad Windwalker',
            stats: { hp: heroBaseStats.hp, def: heroBaseStats.def },
            maxStats: { hp: heroBaseStats.hp, def: heroBaseStats.def },
            energy: heroBaseStats.maxEnergy,
            maxEnergy: heroBaseStats.maxEnergy,
            deck: [
                'c_strike', 'c_strike', 'c_strike',
                'c_guard', 'c_guard',
                'c_focus', 'c_cyclone', 'c_lantern'
            ]
        };

        const monsters = [
            {
                id: 'm_mirage_jackal',
                name: 'Mirage Jackal',
                stats: { hp: 28, atk: 7, def: 1 },
                intent: { type: 'attack', element: 'air', value: 8, name: 'Gust Swipe' }
            },
            {
                id: 'm_sand_wraith',
                name: 'Sand Wraith',
                stats: { hp: 24, atk: 6, def: 2 },
                intent: { type: 'attack', element: 'earth', value: 7, name: 'Burrow Crush' }
            },
            {
                id: 'm_dust_serpent',
                name: 'Dust Serpent',
                stats: { hp: 26, atk: 6, def: 1 },
                intent: { type: 'attack', element: 'fire', value: 9, name: 'Pyre Lash' }
            }
        ];

        return {
            hero,
            dungeon: {
                allRooms: [
                    {
                        id: 'mock_battle_room',
                        type: 'battle',
                        tarot: 'The Magician',
                        monsters
                    }
                ]
            }
        };
    }

    prepareHero(hero) {
        return {
            name: hero.name || 'Hero',
            hp: hero.stats.hp,
            maxHp: hero.stats.hp,
            def: hero.stats.def,
            energy: hero.maxEnergy,
            maxEnergy: hero.maxEnergy,
            elementAffinity: 'earth',
            deck: Array.isArray(hero.deck) ? hero.deck.slice() : []
        };
    }

    prepareMonster(monster) {
        return {
            id: monster.id,
            name: monster.name,
            hp: monster.stats.hp,
            maxHp: monster.stats.hp,
            def: monster.stats.def || 0,
            atk: monster.stats.atk,
            elementAffinity: ELEMENT_AFFINITIES[monster.id] || 'air',
            maxEnergy: 2,
            energy: 2,
            intent: { ...monster.intent }
        };
    }

    shuffle(array) {
        const copy = array.slice();
        for (let i = copy.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }
}

const demo = new ElementalCombatDemo();
demo.init();
