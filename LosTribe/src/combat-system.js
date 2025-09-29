// LosTribe Combat System
// Turn-based combat with tarot cards and elemental dice

class CombatSystem {
    constructor(hero, monsters, roomTarot) {
        this.hero = hero;
        this.monsters = monsters;
        this.roomTarot = roomTarot;
        this.turn = 'hero'; // 'hero' or 'monster'
        this.combatLog = [];
        this.isActive = false;
        this.currentMonsterIndex = 0;
    }

    startCombat() {
        this.isActive = true;
        this.combatLog = [];
        this.log(`Combat begins in ${this.roomTarot} chamber!`);
        this.log(`${this.hero.name} faces ${this.monsters.length} enemies`);

        // Initialize monster turns
        this.monsters.forEach(monster => {
            monster.currentHP = monster.stats.hp;
            monster.energy = monster.stats.spd;
            monster.intent = this.calculateMonsterIntent(monster);
        });
    }

    calculateMonsterIntent(monster) {
        // Simple AI: monsters use basic attack most of the time
        const intents = [
            { action: 'attack', weight: 70 },
            { action: 'defend', weight: 20 },
            { action: 'special', weight: 10 }
        ];

        return this.weightedPick(intents);
    }

    weightedPick(items) {
        const total = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * total;

        for (const item of items) {
            if (random < item.weight) return item;
            random -= item.weight;
        }

        return items[items.length - 1];
    }

    playCard(card, target = null) {
        if (this.turn !== 'hero' || !this.isActive) return false;

        // Check if hero has energy for this card
        if (this.hero.energy < card.cost) {
            this.log(`${this.hero.name} doesn't have enough energy!`);
            return false;
        }

        // Apply card effect
        this.hero.energy -= card.cost;

        let effectResult = null;

        switch(card.type) {
            case 'attack':
                effectResult = this.playAttackCard(card, target);
                break;
            case 'defense':
                effectResult = this.playDefenseCard(card);
                break;
            case 'utility':
                effectResult = this.playUtilityCard(card, target);
                break;
        }

        this.log(`${this.hero.name} plays ${card.name}: ${effectResult}`);

        // Check if all monsters are defeated
        if (this.checkVictory()) {
            this.endCombat('victory');
            return true;
        }

        // Monster turn
        this.monsterTurn();

        return true;
    }

    playAttackCard(card, target) {
        if (!target) target = this.getRandomMonster();

        const damage = this.calculateDamage(card.damage, this.hero.stats.atk, target.stats.def);
        target.currentHP -= damage;

        return `Deals ${damage} damage to ${target.name}`;
    }

    playDefenseCard(card) {
        const defense = card.defense || 10;
        this.hero.currentStats.def += defense;

        return `Gains ${defense} defense`;
    }

    playUtilityCard(card, target) {
        switch(card.effect) {
            case 'heal':
                const heal = Math.min(card.heal, this.hero.maxStats.hp - this.hero.currentStats.hp);
                this.hero.currentStats.hp += heal;
                return `Heals ${heal} HP`;
            case 'energy':
                this.hero.energy += card.energy;
                return `Gains ${card.energy} energy`;
            case 'draw':
                return `Draws ${card.draw} cards`;
        }
    }

    calculateDamage(baseDamage, attackerAtk, defenderDef) {
        const modifiedDamage = baseDamage + (attackerAtk * 0.1);
        const reducedDamage = Math.max(1, modifiedDamage - (defenderDef * 0.05));
        return Math.floor(reducedDamage);
    }

    monsterTurn() {
        this.turn = 'monster';

        this.monsters.forEach((monster, index) => {
            if (monster.currentHP <= 0) return;

            setTimeout(() => {
                this.executeMonsterAction(monster);
            }, index * 1000); // Stagger monster actions
        });

        // After all monsters act, back to hero turn
        setTimeout(() => {
            this.turn = 'hero';
            this.hero.energy = Math.min(this.hero.maxEnergy, this.hero.energy + 2); // Energy regen
        }, this.monsters.length * 1000 + 500);
    }

    executeMonsterAction(monster) {
        if (monster.currentHP <= 0) return;

        switch(monster.intent.action) {
            case 'attack':
                const damage = this.calculateDamage(monster.stats.atk, monster.stats.atk, this.hero.currentStats.def);
                this.hero.currentStats.hp -= damage;
                this.log(`${monster.name} attacks for ${damage} damage!`);
                break;

            case 'defend':
                monster.currentHP += 5; // Simple defense
                this.log(`${monster.name} defends!`);
                break;

            case 'special':
                this.executeSpecialAttack(monster);
                break;
        }

        // Recalculate intent for next turn
        monster.intent = this.calculateMonsterIntent(monster);

        // Check if hero is defeated
        if (this.hero.currentStats.hp <= 0) {
            this.endCombat('defeat');
        }
    }

    executeSpecialAttack(monster) {
        // Simple special attack - could be expanded based on monster type
        const damage = Math.floor(monster.stats.atk * 1.5);
        this.hero.currentStats.hp -= damage;
        this.log(`${monster.name} uses special attack for ${damage} damage!`);
    }

    getRandomMonster() {
        const aliveMonsters = this.monsters.filter(m => m.currentHP > 0);
        return aliveMonsters[Math.floor(Math.random() * aliveMonsters.length)];
    }

    checkVictory() {
        return this.monsters.every(monster => monster.currentHP <= 0);
    }

    endCombat(result) {
        this.isActive = false;

        if (result === 'victory') {
            this.log(`Victory! ${this.hero.name} defeats all enemies!`);
            this.grantRewards();
        } else {
            this.log(`Defeat! ${this.hero.name} falls in battle...`);
        }

        // Callback for UI updates
        if (this.onCombatEnd) {
            this.onCombatEnd(result);
        }
    }

    grantRewards() {
        // Simple reward system - could be expanded
        this.hero.currentStats.hp = Math.min(this.hero.maxStats.hp,
            this.hero.currentStats.hp + 20); // Heal after combat

        this.log(`${this.hero.name} gains 20 HP and feels stronger!`);
    }

    log(message) {
        this.combatLog.push({
            turn: this.combatLog.length + 1,
            message: message,
            timestamp: Date.now()
        });

        // Keep only last 20 messages
        if (this.combatLog.length > 20) {
            this.combatLog.shift();
        }
    }

    getCombatState() {
        return {
            hero: {
                name: this.hero.name,
                hp: this.hero.currentStats.hp,
                maxHp: this.hero.maxStats.hp,
                energy: this.hero.energy,
                maxEnergy: this.hero.maxEnergy,
                defense: this.hero.currentStats.def
            },
            monsters: this.monsters.map(monster => ({
                name: monster.name,
                hp: monster.currentHP,
                maxHp: monster.stats.hp,
                intent: monster.intent
            })),
            currentTurn: this.turn,
            isActive: this.isActive,
            log: this.combatLog.slice(-5) // Last 5 messages
        };
    }
}

// Card definitions for the tarot system
const CARD_DEFINITIONS = {
    // Major Arcana Cards
    'The Fool': {
        name: 'The Fool',
        cost: 1,
        type: 'utility',
        effect: 'draw',
        draw: 2,
        description: 'Take a leap of faith and draw additional cards'
    },
    'The Magician': {
        name: 'The Magician',
        cost: 2,
        type: 'attack',
        damage: 15,
        description: 'Channel focused energy into a powerful attack'
    },
    'The High Priestess': {
        name: 'The High Priestess',
        cost: 1,
        type: 'defense',
        defense: 8,
        description: 'Access hidden wisdom for protection'
    },
    'The Empress': {
        name: 'The Empress',
        cost: 2,
        type: 'utility',
        effect: 'heal',
        heal: 25,
        description: 'Nurture yourself with healing energy'
    },
    'The Emperor': {
        name: 'The Emperor',
        cost: 3,
        type: 'defense',
        defense: 15,
        description: 'Establish order and structure your defenses'
    },

    // Elemental Cards
    'Fire Strike': {
        name: 'Fire Strike',
        cost: 1,
        type: 'attack',
        damage: 12,
        element: 'fire',
        description: 'Burning attack that may apply burn status'
    },
    'Water Shield': {
        name: 'Water Shield',
        cost: 1,
        type: 'defense',
        defense: 10,
        element: 'water',
        description: 'Flowing defense that adapts to threats'
    },
    'Earth Wall': {
        name: 'Earth Wall',
        cost: 2,
        type: 'defense',
        defense: 20,
        element: 'earth',
        description: 'Solid protection from the earth itself'
    },
    'Air Rush': {
        name: 'Air Rush',
        cost: 0,
        type: 'utility',
        effect: 'energy',
        energy: 2,
        element: 'air',
        description: 'Swift movement generates additional energy'
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CombatSystem, CARD_DEFINITIONS };
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.CombatSystem = CombatSystem;
    window.CARD_DEFINITIONS = CARD_DEFINITIONS;
}
