import { Start } from './scenes/Start.js';
import { AdminScene } from './scenes/AdminScene.js';

const config = {
    type: Phaser.AUTO,
    title: 'LosTribe - Evolutionary Roguelike',
    description: 'A roguelike game with White Star Tarot mechanics',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#000000',
    pixelArt: false,
    scene: [
        Start,
        AdminScene
    ],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

// Check URL parameters for admin mode
const urlParams = new URLSearchParams(window.location.search);
const adminMode = urlParams.get('admin') === 'true';

const game = new Phaser.Game(config);

// If admin mode, start with AdminScene
if (adminMode) {
    game.scene.start('AdminScene');
} else {
    game.scene.start('Start');
}

// Make game globally accessible for admin view
window.game = game;