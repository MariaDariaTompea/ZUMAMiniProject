class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // We will generate placeholder graphics here instead of loading external images
        // so you can run the game immediately without needing to download assets.
        
        // 1. Generate Ball Graphics
        const ballColors = [
            { key: 'ball_red', color: 0xff0000 },
            { key: 'ball_green', color: 0x00ff00 },
            { key: 'ball_blue', color: 0x0000ff },
            { key: 'ball_yellow', color: 0xffff00 }
        ];

        ballColors.forEach(b => {
            const graphics = this.add.graphics();
            graphics.fillStyle(b.color, 1);
            graphics.fillCircle(16, 16, 16);
            
            // Add a little highlight to make it look 3D
            graphics.fillStyle(0xffffff, 0.4);
            graphics.fillCircle(10, 10, 6);
            
            graphics.generateTexture(b.key, 32, 32);
            graphics.destroy();
        });

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
