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

        // Load custom ball textures (normal state)
        this.load.image('ball_red', 'assets/balls/red_normal.png');
        this.load.image('ball_green', 'assets/balls/green_normal.png');
        this.load.image('ball_blue', 'assets/balls/blue_normal.png');
        this.load.image('ball_yellow', 'assets/balls/yellow_normal.png');
        this.load.image('ball_orange', 'assets/balls/orange_normal.png');
        this.load.image('ball_purple', 'assets/balls/purple_normal.png');
        this.load.image('ball_white', 'assets/balls/white_normal.png');
        this.load.image('ball_cyan', 'assets/balls/cyan_normal.png');
        this.load.image('ball_pink', 'assets/balls/pink_normal.png');
        this.load.image('ball_black', 'assets/balls/black_normal.png');

        const ballColors = [
            { key: 'ball_red', color: 0xff0000 },
            { key: 'ball_green', color: 0x00ff00 },
            { key: 'ball_blue', color: 0x0000ff },
            { key: 'ball_yellow', color: 0xffff00 },
            { key: 'ball_orange', color: 0xff6600 },
            { key: 'ball_purple', color: 0x9900ff },
            { key: 'ball_white', color: 0xffffff },
            { key: 'ball_cyan', color: 0x00ffff },
            { key: 'ball_pink', color: 0xff66cc },
            { key: 'ball_black', color: 0x111111 }
        ];

        // Procedural fallback if assets are missing
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

            // Check if it is a missing ball texture and generate a procedural fallback
            const matchedBallColor = ballColors.find(b => b.key === fileObj.key);
            if (matchedBallColor) {
                console.warn(`Ball texture ${fileObj.key} not found. Generating a procedural fallback!`);
                const fallbackGraphics = this.make.graphics({ x: 0, y: 0, add: false });
                fallbackGraphics.fillStyle(matchedBallColor.color, 1);
                fallbackGraphics.fillCircle(22, 22, 22);
                
                // Add a little highlight to make it look 3D
                fallbackGraphics.fillStyle(0xffffff, 0.4);
                fallbackGraphics.fillCircle(14, 14, 10);
                
                fallbackGraphics.generateTexture(matchedBallColor.key, 44, 44);
                fallbackGraphics.destroy();
            }
        });

        // 1. Generate programmatic helper graphics (shard & shooter)
        const graphics = this.add.graphics();
        
        // Create a sharp shard texture for the shattering effect
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
