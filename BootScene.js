class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // We will generate placeholder graphics here instead of loading external images
        // so you can run the game immediately without needing to download assets.
        
        // Wait until we actually generate the map using generator.html!
        // We will load from mapsai/map_X.png
        const levelNum = window.currentLevelIndex + 1;
        this.load.image('map', `assets/mapsai/map_${levelNum}.png`);

        // 1. Generate Ball Graphics
        const ballColors = [
            { key: 'ball_red', color: 0xff0000 },
            { key: 'ball_green', color: 0x00ff00 },
            { key: 'ball_blue', color: 0x0000ff },
            { key: 'ball_yellow', color: 0xffff00 }
        ];

        const graphics = this.add.graphics();
        ballColors.forEach(b => {
            graphics.clear();
            graphics.fillStyle(b.color, 1);
            graphics.fillCircle(22, 22, 22);
            
            // Add a little highlight to make it look 3D
            graphics.fillStyle(0xffffff, 0.4);
            graphics.fillCircle(14, 14, 10);
            graphics.generateTexture(b.key, 44, 44);
        });

        // Create a sharp shard texture for the shattering effect
        graphics.clear();
        graphics.fillStyle(0xffffff, 1);
        graphics.beginPath();
        graphics.moveTo(5, 0);
        graphics.lineTo(10, 10);
        graphics.lineTo(0, 8);
        graphics.closePath();
        graphics.fillPath();
        graphics.generateTexture('shard', 10, 10);

        graphics.destroy();

        // 2. Generate Shooter (Frog) Graphic
        const shooterGraphics = this.add.graphics();
        shooterGraphics.fillStyle(0x00cc00, 1);
        shooterGraphics.fillRect(0, 0, 40, 40);
        // Add a "snout" so we know which way it's facing
        shooterGraphics.fillStyle(0x00ff00, 1);
        shooterGraphics.fillRect(40, 10, 20, 20);
        shooterGraphics.generateTexture('shooter', 60, 40);
        shooterGraphics.destroy();
    }

    create() {
        // Once assets are ready, transition to the Game Scene
        this.scene.start('GameScene');
    }
}
