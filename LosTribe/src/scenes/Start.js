export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
        // No external assets needed for the minimalist splash screen.
    }

    create() {
        const { width, height } = this.cameras.main;

        this.cameras.main.setBackgroundColor('#0d0b1e');

        this.add.text(width / 2, height * 0.22, 'LOST TRIBE', {
            fontFamily: 'Cinzel, serif',
            fontSize: '72px',
            color: '#ffe082',
            stroke: '#120922',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.32, 'Egyptian · Gypsy · Air Clan', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '22px',
            color: '#b3e5fc'
        }).setOrigin(0.5);

        const menuItems = [
            {
                label: '▶  New Game',
                handler: () => this.launchNewGame()
            },
            {
                label: '⮯  Load Game',
                handler: () => this.launchLoadGame()
            },
            {
                label: '⚙  Settings',
                handler: () => this.launchSettings()
            },
            {
                label: '🔮  Admin Mode',
                handler: () => this.scene.start('AdminScene')
            }
        ];

        const baseY = height * 0.48;
        const spacing = 54;

        menuItems.forEach((item, index) => {
            const text = this.add.text(width / 2, baseY + index * spacing, item.label, {
                fontFamily: 'Arial, sans-serif',
                fontSize: '32px',
                color: '#fafafa'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            text.on('pointerover', () => {
                text.setStyle({ color: '#ffca28' });
            });

            text.on('pointerout', () => {
                text.setStyle({ color: '#fafafa' });
            });

            text.on('pointerdown', () => {
                item.handler();
            });
        });

        this.add.text(width / 2, height * 0.78, 'Tip: Admin Mode opens the Backstage Generator for content teams.', {
            fontFamily: 'Courier New, monospace',
            fontSize: '18px',
            color: '#90caf9'
        }).setOrigin(0.5);

        this.add.text(width / 2, height * 0.92, '© 2025 Los Tribe Collective', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '16px',
            color: '#616161'
        }).setOrigin(0.5);
    }

    launchNewGame() {
        console.warn('[StartScene] New Game flow not yet connected.');
        // TODO: Hook up when the primary gameplay scene is implemented.
    }

    launchLoadGame() {
        console.warn('[StartScene] Load Game flow not yet connected.');
        // TODO: Replace with load-game UI once persistence is available.
    }

    launchSettings() {
        console.warn('[StartScene] Settings menu not yet connected.');
        // TODO: Implement audio/video/difficulty settings screen.
    }
}
