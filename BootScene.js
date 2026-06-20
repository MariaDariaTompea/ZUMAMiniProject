class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // We will generate placeholder graphics here instead of loading external images
        // so you can run the game immediately without needing to download assets.
        
        const levelNum = window.currentLevelIndex + 1;
        const bgKey = `map_bg_${levelNum}`;
        const fgKey = `map_fg_${levelNum}`;

        // Load the background (back) and foreground overlay (front) if they exist
        this.load.image(bgKey, `assets/maps/level${levelNum}/back.png`);
        this.load.image(fgKey, `assets/maps/level${levelNum}/front.png`);

        // Procedural fallback if the background image is missing
        this.load.on('loaderror', (fileObj) => {
            if (fileObj.key === bgKey) {
                console.warn(`Map background image assets/maps/level${levelNum}/back.png not found. Generating a procedural fallback background!`);
                const levelData = window.LEVELS[window.currentLevelIndex];
                if (levelData) {
                    const fallbackGraphics = this.make.graphics({ x: 0, y: 0, add: false });
                    
                    // Dark forest/temple style background
                    fallbackGraphics.fillStyle(0x131a11, 1);
                    fallbackGraphics.fillRect(0, 0, 800, 600);
                    
                    // Subtle background grid lines
                    fallbackGraphics.lineStyle(1, 0x1f2b1c, 1);
                    for (let x = 0; x < 800; x += 40) {
                        fallbackGraphics.lineBetween(x, 0, x, 600);
                    }
                    for (let y = 0; y < 600; y += 40) {
                        fallbackGraphics.lineBetween(0, y, 800, y);
                    }
                    
                    // Draw outer brown stone track outline
                    const path = new Phaser.Curves.Spline(levelData.points);
                    fallbackGraphics.lineStyle(44, 0x2e261f, 1);
                    path.draw(fallbackGraphics, 256);
                    
                    // Draw inner sand track fill
                    fallbackGraphics.lineStyle(34, 0x473d33, 1);
                    path.draw(fallbackGraphics, 256);

                    // Draw inner track groove line
                    fallbackGraphics.lineStyle(4, 0x1a1512, 1);
                    path.draw(fallbackGraphics, 256);
                    
                    // Draw Spawn Portal (Green)
                    fallbackGraphics.fillStyle(0x00cc44, 0.8);
                    fallbackGraphics.fillCircle(levelData.points[0], levelData.points[1], 22);
                    fallbackGraphics.lineStyle(3, 0xffffff, 0.9);
                    fallbackGraphics.strokeCircle(levelData.points[0], levelData.points[1], 22);
                    
                    // Draw Danger Skull Portal (Red)
                    const endX = levelData.points[levelData.points.length - 2];
                    const endY = levelData.points[levelData.points.length - 1];
                    fallbackGraphics.fillStyle(0xcc1111, 0.8);
                    fallbackGraphics.fillCircle(endX, endY, 22);
                    fallbackGraphics.lineStyle(3, 0xffffff, 0.9);
                    fallbackGraphics.strokeCircle(endX, endY, 22);
                    
                    fallbackGraphics.generateTexture(bgKey, 800, 600);
                    fallbackGraphics.destroy();
                }
            }
        });

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
