// src/scenes/AdminScene.js
import { generateCompleteRun } from '../backstage-generator.js';

export class AdminScene extends Phaser.Scene {
    constructor() {
        super({ key: 'AdminScene' });
        this.runData = null;
        this.currentView = 'hero';
    }

    preload() {
        // Create a simple background
        this.add.graphics()
            .fillStyle(0x000033)
            .fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

        // Add some UI elements
        this.add.text(50, 30, '🔮 LosTribe Backstage Generator', {
            fontSize: '32px',
            color: '#64b5f6',
            fontFamily: 'Arial, sans-serif'
        });

        this.add.text(50, 70, 'Complete game state generation and admin view', {
            fontSize: '16px',
            color: '#e0e0e0',
            fontFamily: 'Arial, sans-serif'
        });
    }

    create() {
        // Generate initial run
        this.generateNewRun();

        // Create UI buttons
        this.createUI();

        // Listen for keyboard input
        this.input.keyboard.on('keydown', this.handleKeyPress, this);
    }

    generateNewRun() {
        this.runData = generateCompleteRun({
            totalFloors: 7,
            seed: Math.floor(Math.random() * 1000000)
        });
        this.updateDisplay();
    }

    createUI() {
        const buttonStyle = {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#64b5f6',
            padding: { x: 15, y: 8 }
        };

        // Generate button
        this.add.text(50, 120, '🎭 Generate New Run', buttonStyle)
            .setInteractive()
            .on('pointerdown', () => this.generateNewRun())
            .setStyle({ backgroundColor: '#42a5f5' });

        // View toggle buttons
        const views = [
            { key: 'hero', label: '👤 Hero', y: 170 },
            { key: 'dungeon', label: '🏰 Dungeon', y: 220 },
            { key: 'encounters', label: '⚔️ Encounters', y: 270 },
            { key: 'treasures', label: '💎 Treasures', y: 320 },
            { key: 'events', label: '🎭 Events', y: 370 },
            { key: 'evolution', label: '🌱 Evolution', y: 420 }
        ];

        views.forEach(view => {
            this.add.text(50, view.y, view.label, buttonStyle)
                .setInteractive()
                .on('pointerdown', () => {
                    this.currentView = view.key;
                    this.updateDisplay();
                });
        });

        // Instructions
        this.add.text(50, 500, 'Press R to generate new run', {
            fontSize: '14px',
            color: '#bdbdbd'
        });

        this.add.text(50, 520, 'Press 1-6 to switch views', {
            fontSize: '14px',
            color: '#bdbdbd'
        });

        // Create display area
        this.displayArea = this.add.container(400, 50);
    }

    updateDisplay() {
        if (!this.runData) return;

        // Clear previous display
        this.displayArea.removeAll(true);

        const hero = this.runData.hero;
        const dungeon = this.runData.dungeon;

        switch (this.currentView) {
            case 'hero':
                this.showHeroView();
                break;
            case 'dungeon':
                this.showDungeonView();
                break;
            case 'encounters':
                this.showEncountersView();
                break;
            case 'treasures':
                this.showTreasuresView();
                break;
            case 'events':
                this.showEventsView();
                break;
            case 'evolution':
                this.showEvolutionView();
                break;
        }
    }

    showHeroView() {
        const hero = this.runData.hero;

        const title = this.add.text(0, 0, `👤 ${hero.name} the ${hero.class}`, {
            fontSize: '24px',
            color: '#81c784',
            fontFamily: 'Arial, sans-serif'
        });

        const stats = this.add.text(0, 40, `
HP: ${hero.stats.hp} | ATK: ${hero.stats.atk} | DEF: ${hero.stats.def} | SPD: ${hero.stats.spd}
Element: ${hero.elementAffinity} | Tarot: ${hero.tarotDestiny}
Deck: ${hero.deck.length} cards | Energy: ${hero.energy}/${hero.maxEnergy}
        `.trim(), {
            fontSize: '16px',
            color: '#e0e0e0',
            fontFamily: 'Courier New, monospace',
            lineHeight: 1.4
        });

        this.displayArea.add([title, stats]);
    }

    showDungeonView() {
        const floors = this.runData.dungeon.floors;

        const title = this.add.text(0, 0, '🏰 Dungeon Layout', {
            fontSize: '24px',
            color: '#64b5f6',
            fontFamily: 'Arial, sans-serif'
        });

        let yOffset = 40;
        floors.forEach(floor => {
            const floorText = this.add.text(0, yOffset,
                `Floor ${floor.level}: ${floor.rooms.length} rooms, ${floor.monsters.length} monsters`,
                { fontSize: '16px', color: '#e0e0e0' }
            );

            yOffset += 25;

            // Show room types
            const roomTypes = floor.rooms.map(r => r.type).join(', ');
            const roomsText = this.add.text(20, yOffset, roomTypes, {
                fontSize: '14px',
                color: '#bdbdbd'
            });

            yOffset += 25;
            this.displayArea.add([floorText, roomsText]);
        });

        this.displayArea.add(title);
    }

    showEncountersView() {
        const encounters = this.runData.encounters.slice(0, 10); // Show first 10

        const title = this.add.text(0, 0, `⚔️ Encounters (${this.runData.encounters.length} total)`, {
            fontSize: '24px',
            color: '#e57373',
            fontFamily: 'Arial, sans-serif'
        });

        let yOffset = 40;
        encounters.forEach(encounter => {
            const encounterText = this.add.text(0, yOffset,
                `${encounter.monster.name} (${encounter.difficulty}) - Floor ${encounter.floor}`,
                { fontSize: '14px', color: '#e0e0e0' }
            );

            yOffset += 20;
            if (yOffset > 600) return; // Prevent overflow
        });

        this.displayArea.add(title);
    }

    showTreasuresView() {
        const treasures = this.runData.treasures.slice(0, 8); // Show first 8

        const title = this.add.text(0, 0, `💎 Treasures (${this.runData.treasures.length} total)`, {
            fontSize: '24px',
            color: '#ffb74d',
            fontFamily: 'Arial, sans-serif'
        });

        let yOffset = 40;
        treasures.forEach(treasure => {
            const treasureText = this.add.text(0, yOffset,
                `${treasure.type} - ${treasure.rarity} - Floor ${treasure.floor} (${treasure.value}g)`,
                { fontSize: '14px', color: '#e0e0e0' }
            );

            yOffset += 20;
            if (yOffset > 600) return;
        });

        this.displayArea.add(title);
    }

    showEventsView() {
        const events = this.runData.events;

        const title = this.add.text(0, 0, `🎭 Events (${events.length} total)`, {
            fontSize: '24px',
            color: '#ba68c8',
            fontFamily: 'Arial, sans-serif'
        });

        let yOffset = 40;
        events.forEach(event => {
            const eventText = this.add.text(0, yOffset,
                `${event.tarotCard} - Floor ${event.floor}`,
                { fontSize: '14px', color: '#e0e0e0' }
            );

            yOffset += 20;
            if (yOffset > 600) return;
        });

        this.displayArea.add(title);
    }

    showEvolutionView() {
        const evolution = this.runData.evolution;

        const title = this.add.text(0, 0, '🌱 Evolution Path', {
            fontSize: '24px',
            color: '#81c784',
            fontFamily: 'Arial, sans-serif'
        });

        const pathText = this.add.text(0, 40, `
Starting: ${evolution.startingState.stats.hp}HP, ${evolution.startingState.stats.atk}ATK
Milestones: ${evolution.milestones.length}
Final State: Complete transformation journey
        `.trim(), {
            fontSize: '14px',
            color: '#e0e0e0',
            fontFamily: 'Courier New, monospace'
        });

        this.displayArea.add([title, pathText]);
    }

    handleKeyPress(event) {
        switch (event.code) {
            case 'KeyR':
                this.generateNewRun();
                break;
            case 'Digit1':
                this.currentView = 'hero';
                this.updateDisplay();
                break;
            case 'Digit2':
                this.currentView = 'dungeon';
                this.updateDisplay();
                break;
            case 'Digit3':
                this.currentView = 'encounters';
                this.updateDisplay();
                break;
            case 'Digit4':
                this.currentView = 'treasures';
                this.updateDisplay();
                break;
            case 'Digit5':
                this.currentView = 'events';
                this.updateDisplay();
                break;
            case 'Digit6':
                this.currentView = 'evolution';
                this.updateDisplay();
                break;
        }
    }
}
