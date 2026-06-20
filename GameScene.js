class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        const levelNum = window.currentLevelIndex + 1;
        const bgKey = `map_bg_${levelNum}`;
        const fgKey = `map_fg_${levelNum}`;

        // Draw the background (depth 0)
        this.add.image(400, 300, bgKey).setDisplaySize(800, 600).setDepth(0);

        // Add the shooter sprite first so createPath can set its position (depth 4)
        this.shooter = this.add.sprite(300, 235, 'shooter').setDepth(4);

        // Setup the path
        this.createPath();

        // Initialize physics groups first so that spawned balls can join chainGroup
        this.chainGroup = this.physics.add.group();
        this.projectilesGroup = this.physics.add.group();

        // Initialize the ball chain
        this.chain = new Chain(this, this.path);
        
        // Firing Mechanics
        this.colors = ['ball_red', 'ball_green', 'ball_blue', 'ball_yellow'];
        
        // Disable context menu for right-click
        this.input.mouse.disableContextMenu();
        
        // Scoring and Combos
        this.score = 0;
        this.zumaScore = 1000;
        this.zumaMode = false;
        this.consecutiveMatches = 0;
        this.comboMultiplier = 1;

        this.scoreText = this.add.text(20, 20, 'Score: 0', {
            fontSize: '24px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });

        // Zuma Bar Background
        this.barBg = this.add.graphics();
        this.barBg.fillStyle(0x000000, 0.8);
        this.barBg.lineStyle(2, 0xffffff, 1);
        this.barBg.fillRect(200, 20, 400, 20);
        this.barBg.strokeRect(200, 20, 400, 20);

        // Zuma Bar Fill
        this.barFill = this.add.graphics();
        this.updateZumaBar();
        
        this.initBalls();
        
        // Pointer tracking for shooter rotation
        this.input.on('pointermove', (pointer) => {
            const angle = Phaser.Math.Angle.Between(this.shooter.x, this.shooter.y, pointer.x, pointer.y);
            this.shooter.rotation = angle;
            this.updateBallPositions();
        });

        // Fire or Swap on click
        this.input.on('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) {
                this.swapBalls();
            } else if (this.currentBallSprite && this.chain.state === 'PLAYING') {
                this.fireBall(pointer);
            }
        });

        // Setup physics overlap callback
        this.physics.add.overlap(
            this.projectilesGroup,
            this.chainGroup,
            this.handleProjectileHit,
            null,
            this
        );

        // Draw the foreground bridges/tunnels overlay (depth 5) if it exists
        if (this.textures.exists(fgKey)) {
            this.add.image(400, 300, fgKey).setDisplaySize(800, 600).setDepth(5);
        }
    }

    getAvailableColor() {
        let availableColors = this.colors;
        if (this.chain && this.chain.segments.length > 0) {
            const colorsOnBoard = new Set();
            for (let s = 0; s < this.chain.segments.length; s++) {
                const seg = this.chain.segments[s];
                for (let j = 0; j < seg.balls.length; j++) {
                    colorsOnBoard.add(seg.balls[j].colorKey);
                }
            }
            availableColors = Array.from(colorsOnBoard);
        }
        if (availableColors.length === 0) {
            availableColors = this.colors;
        }
        return Phaser.Math.RND.pick(availableColors);
    }

    initBalls() {
        this.currentBallColor = this.getAvailableColor();
        this.nextBallColor = this.getAvailableColor();
        this.createBallSprites();
    }

    onMatchMade(count, isCascade, x, y) {
        if (!isCascade) {
            this.consecutiveMatches++;
        } else {
            this.comboMultiplier++;
        }
        
        let multiplier = this.comboMultiplier;
        
        // "break 3 in a row, the 4th gives double, 5th triple..."
        if (this.consecutiveMatches >= 4) {
            multiplier += (this.consecutiveMatches - 3);
        }
        
        const points = count * 10 * multiplier;
        this.addScore(points);
        
        // Show floating combo text if multiplier > 1
        if (multiplier > 1) {
            const comboText = this.add.text(x, y - 20, 'x' + multiplier, {
                fontSize: '32px',
                fontFamily: 'Arial',
                color: '#ffff00',
                stroke: '#ff0000',
                strokeThickness: 6
            }).setOrigin(0.5);
            
            this.tweens.add({
                targets: comboText,
                y: y - 60,
                alpha: 0,
                duration: 1000,
                onComplete: () => comboText.destroy()
            });
        }
    }

    resetCombo() {
        this.consecutiveMatches = 0;
    }

    addScore(points) {
        if (this.chain && this.chain.state === 'GAME_OVER') return;
        
        this.score += points;
        this.scoreText.setText('Score: ' + this.score);
        
        if (!this.zumaMode) {
            this.updateZumaBar();
            
            if (this.score >= this.zumaScore) {
                this.triggerZumaMode();
            }
        }
    }

    updateZumaBar() {
        this.barFill.clear();
        const progress = Math.min(this.score / this.zumaScore, 1);
        const fillWidth = progress * 396; // 400 - 4 for padding
        
        // Color changes from red to green as it fills
        const r = Math.floor(255 * (1 - progress));
        const g = Math.floor(255 * progress);
        const color = (r << 16) + (g << 8);
        
        this.barFill.fillStyle(color, 1);
        this.barFill.fillRect(202, 22, fillWidth, 16);
    }

    triggerZumaMode() {
        this.zumaMode = true;
        this.chain.zumaMode = true;
        this.chain.zumaPushbackTimer = 5; // 5 seconds pushback
        
        const zumaText = this.add.text(400, 150, 'ZUMA!', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffff00',
            stroke: '#ff0000',
            strokeThickness: 8
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: zumaText,
            scale: 1.5,
            alpha: 0,
            duration: 1500,
            onComplete: () => zumaText.destroy()
        });

        // Make the bar shine permanently
        this.tweens.addCounter({
            from: 0,
            to: 255,
            duration: 500,
            yoyo: true,
            repeat: -1,
            onUpdate: (tween) => {
                const val = Math.floor(tween.getValue());
                const color = (val << 16) + (255 << 8) + val;
                this.barFill.clear();
                this.barFill.fillStyle(color, 1);
                this.barFill.fillRect(202, 22, 396, 16);
            }
        });
    }

    loadNextBall() {
        this.currentBallColor = this.nextBallColor;
        this.nextBallColor = this.getAvailableColor();
        this.createBallSprites();
    }

    swapBalls() {
        if (!this.currentBallSprite || !this.nextBallSprite) return;
        
        const temp = this.currentBallColor;
        this.currentBallColor = this.nextBallColor;
        this.nextBallColor = temp;
        
        this.createBallSprites();
    }

    createBallSprites() {
        if (this.currentBallSprite) this.currentBallSprite.destroy();
        if (this.nextBallSprite) this.nextBallSprite.destroy();
        
        // Mouth ball (depth 4)
        this.currentBallSprite = this.add.sprite(this.shooter.x, this.shooter.y, this.currentBallColor);
        this.currentBallSprite.setScale(0.8);
        this.currentBallSprite.setDepth(4);
        
        // Head ball (depth 4)
        this.nextBallSprite = this.add.sprite(this.shooter.x, this.shooter.y, this.nextBallColor);
        this.nextBallSprite.setScale(0.4);
        this.nextBallSprite.setDepth(4);
        
        this.updateBallPositions();
    }

    updateBallPositions() {
        const angle = this.shooter.rotation;
        
        // Next ball stays perfectly centered on the frog
        if (this.nextBallSprite) {
            this.nextBallSprite.x = this.shooter.x;
            this.nextBallSprite.y = this.shooter.y;
        }
        
        // Current ball sits in the mouth (offset by 25 pixels)
        const mouthOffset = 25;
        if (this.currentBallSprite) {
            this.currentBallSprite.x = this.shooter.x + Math.cos(angle) * mouthOffset;
            this.currentBallSprite.y = this.shooter.y + Math.sin(angle) * mouthOffset;
        }
    }

    fireBall(pointer) {
        if (!this.currentBallSprite) return;

        this.comboMultiplier = 1; // Reset cascade combo multiplier for this shot
        
        const angle = this.shooter.rotation;
        const speed = 950; // Snappy, satisfying Zuma projectile speed!
        
        // Start projectile from the mouth's position
        const startX = this.currentBallSprite.x;
        const startY = this.currentBallSprite.y;
        
        // Create projectile as physics sprite (depth 3)
        const projectile = this.projectilesGroup.create(startX, startY, this.currentBallColor);
        projectile.colorKey = this.currentBallColor;
        projectile.setDepth(3);
        
        if (projectile.body) {
            // Set circle body radius 14, offset to center (22 - 14 = 8)
            projectile.body.setCircle(14, 8, 8);
            
            // Set velocity
            projectile.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
        }
        
        this.loadNextBall();
    }

    handleProjectileHit(projectile, chainBall) {
        if (!projectile.active || !projectile.body || !projectile.body.enable) return;
        if (!this.chain || this.chain.state !== 'PLAYING') return;
        
        // Disable projectile body immediately to prevent multiple overlaps in the same frame
        projectile.body.enable = false;
        
        // Find which segment and which index this chainBall belongs to
        let found = false;
        for (let s = 0; s < this.chain.segments.length; s++) {
            const seg = this.chain.segments[s];
            const bIndex = seg.balls.indexOf(chainBall);
            if (bIndex !== -1) {
                // Insert the new ball into the chain
                this.chain.insertBall(projectile.colorKey, s, bIndex, projectile);
                found = true;
                break;
            }
        }
        
        // Destroy the projectile
        projectile.destroy();
    }

    createPath() {
        // Spline points tracing the stone path
        // Starts at Green pearl (bottom right), loops around, ends at Red pearl
        // Load the level data from the levels.js array
        const levelData = window.LEVELS[window.currentLevelIndex];
        
        if (!levelData) {
            console.error("Level data not found!");
            return;
        }

        // Set shooter position
        this.shooter.setPosition(levelData.shooter.x, levelData.shooter.y);

        // Spline points for the stone path
        this.path = new Phaser.Curves.Spline(levelData.points);

        // We no longer draw it here because the user will paint it into the map images!
    }

    update(time, delta) {
        if (this.chain) {
            this.chain.update(time, delta);
        }

        // Clean up out of bounds projectiles
        if (this.projectilesGroup) {
            this.projectilesGroup.getChildren().forEach((p) => {
                if (p.x < -20 || p.x > 820 || p.y < -20 || p.y > 620) {
                    p.destroy();
                }
            });
        }

        // Ensure frog doesn't hold colors that no longer exist on the board
        if (this.chain && this.chain.segments.length > 0) {
            const colorsOnBoard = new Set();
            for (let s = 0; s < this.chain.segments.length; s++) {
                const seg = this.chain.segments[s];
                for (let j = 0; j < seg.balls.length; j++) {
                    colorsOnBoard.add(seg.balls[j].colorKey);
                }
            }
            
            const availableColors = Array.from(colorsOnBoard);
            
            if (availableColors.length > 0) {
                let changed = false;
                if (!colorsOnBoard.has(this.currentBallColor)) {
                    this.currentBallColor = Phaser.Math.RND.pick(availableColors);
                    changed = true;
                }
                if (!colorsOnBoard.has(this.nextBallColor)) {
                    this.nextBallColor = Phaser.Math.RND.pick(availableColors);
                    changed = true;
                }
                if (changed) {
                    this.createBallSprites();
                }
            }
        }

        // Display Game Over screen when all balls are eaten
        if (this.chain && this.chain.state === 'GAME_OVER' && this.chain.segments.length === 0) {
            if (!this.gameOverText) {
                this.gameOverText = this.add.text(400, 300, 'GAME OVER', {
                    fontSize: '64px',
                    fontFamily: 'Arial',
                    color: '#ff0000',
                    stroke: '#ffffff',
                    strokeThickness: 6
                }).setOrigin(0.5);
                
                this.add.text(400, 380, 'Click to Restart', {
                    fontSize: '32px',
                    fontFamily: 'Arial',
                    color: '#ffffff'
                }).setOrigin(0.5);
                
                // Clear any remaining projectiles
                if (this.projectilesGroup) {
                    this.projectilesGroup.clear(true, true);
                }
                
                // Wait for click to restart
                this.input.once('pointerdown', () => {
                    this.scene.restart();
                });
            }
        }

        // Count visible balls on the board
        let visibleBallsCount = 0;
        if (this.chain && this.chain.segments) {
            for (let s = 0; s < this.chain.segments.length; s++) {
                const seg = this.chain.segments[s];
                for (let j = 0; j < seg.balls.length; j++) {
                    if (seg.balls[j].visible) {
                        visibleBallsCount++;
                    }
                }
            }
        }

        // Display You Win screen when all visible balls are cleared in Zuma mode
        if (this.zumaMode && this.chain && this.chain.state !== 'GAME_OVER' && visibleBallsCount === 0) {
            // Clean up any remaining hidden balls in the entry portal
            if (this.chain.segments.length > 0) {
                this.chain.segments.forEach(seg => {
                    seg.balls.forEach(ball => ball.destroy());
                });
                this.chain.segments = [];
            }

            if (!this.winText) {
                this.winText = this.add.text(400, 300, 'ZUMA COMPLETED!\nYOU WIN!', {
                    fontSize: '48px',
                    fontFamily: 'Arial',
                    color: '#00ff00',
                    stroke: '#000000',
                    strokeThickness: 6,
                    align: 'center'
                }).setOrigin(0.5);
                
                // Advance Level Logic
                if (window.currentLevelIndex < window.LEVELS.length - 1) {
                    this.add.text(400, 400, 'Click for NEXT LEVEL', {
                        fontSize: '32px',
                        fontFamily: 'Arial',
                        color: '#ffffff'
                    }).setOrigin(0.5);
                    
                    this.input.once('pointerdown', () => {
                        window.currentLevelIndex++;
                        this.scene.start('BootScene'); // Must reboot to load the new map image
                    });
                } else {
                    this.winText.setText("CONGRATULATIONS!\nYOU BEAT ALL " + window.LEVELS.length + " LEVELS!");
                    this.add.text(400, 400, 'Click to restart from Level 1', {
                        fontSize: '32px',
                        fontFamily: 'Arial',
                        color: '#ffffff'
                    }).setOrigin(0.5);
                    
                    this.input.once('pointerdown', () => {
                        window.currentLevelIndex = 0;
                        this.scene.start('BootScene');
                    });
                }
            }
        }
    }
}
