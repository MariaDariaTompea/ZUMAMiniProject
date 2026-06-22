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

        // Draw the sliding track or portals depending on type
        if (this.levelType === 'sliding' && this.shooterTrack) {
            const p1 = this.shooterTrack.p1;
            const p2 = this.shooterTrack.p2;
            const trackGraphics = this.add.graphics().setDepth(1);
            
            // Draw outer dark groove
            trackGraphics.lineStyle(10, 0x2a2a2a, 0.8);
            trackGraphics.lineBetween(p1.x, p1.y, p2.x, p2.y);
            
            // Draw inner metallic/chrome line
            trackGraphics.lineStyle(4, 0xd0d0d0, 1.0);
            trackGraphics.lineBetween(p1.x, p1.y, p2.x, p2.y);
            
            // Draw small metallic caps/stops at endpoints
            trackGraphics.fillStyle(0x888888, 1.0);
            trackGraphics.fillCircle(p1.x, p1.y, 8);
            trackGraphics.fillCircle(p2.x, p2.y, 8);
            trackGraphics.fillStyle(0xd0d0d0, 1.0);
            trackGraphics.fillCircle(p1.x, p1.y, 4);
            trackGraphics.fillCircle(p2.x, p2.y, 4);
        } else if (this.levelType === 'jumping' && this.shooterPositions) {
            if (!this.textures.exists('portal')) {
                const ptG = this.make.graphics({ x: 0, y: 0, add: false });
                ptG.lineStyle(4, 0xffff00, 1.0);
                ptG.strokeCircle(24, 24, 20);
                ptG.fillStyle(0xffff00, 0.3);
                ptG.fillCircle(24, 24, 16);
                ptG.generateTexture('portal', 48, 48);
                ptG.destroy();
            }
            
            this.portalsGroup = this.add.group();
            this.shooterPositions.forEach((pos, idx) => {
                const portal = this.add.sprite(pos.x, pos.y, 'portal');
                portal.setDepth(2);
                portal.setData('index', idx);
                portal.setData('position', pos);
                
                this.tweens.add({
                    targets: portal,
                    scale: 1.25,
                    alpha: 0.7,
                    duration: 800,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
                
                portal.setInteractive({ useHandCursor: true });
                this.portalsGroup.add(portal);
            });
            this.updatePortals();
        }

        // Initialize physics groups first so that spawned balls can join chainGroup
        this.chainGroup = this.physics.add.group();
        this.projectilesGroup = this.physics.add.group();

        // Firing Mechanics: dynamically configure active colors list based on the level
        this.colors = ['ball_red', 'ball_green', 'ball_blue', 'ball_yellow'];
        if (levelNum >= 8) this.colors.push('ball_orange');
        if (levelNum >= 16) this.colors.push('ball_purple');
        if (levelNum >= 22) this.colors.push('ball_white');
        if (levelNum >= 31) this.colors.push('ball_cyan');
        if (levelNum >= 41) this.colors.push('ball_pink');
        if (levelNum >= 46) this.colors.push('ball_black');

        // Initialize the ball chain
        this.chain = new Chain(this, this.path);
        
        // Disable context menu for right-click
        this.input.mouse.disableContextMenu();
        
        // Scoring and Combos
        this.score = window.playerScore || 0;
        this.zumaScore = 1000;
        this.zumaMode = false;
        this.consecutiveMatches = 0;
        this.comboMultiplier = 1;
        this.levelLostHandled = false;
        this.levelCompleteHandled = false;

        // Hide all overlay screens
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('try-again-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('level-complete-screen').classList.add('hidden');

        // Setup initial UI states in the HTML status bar
        const container = document.getElementById('zuma-bar-container');
        if (container) {
            container.classList.remove('zuma-active');
        }
        this.updateHTMLUI();
        
        this.initBalls();
        
        // Pointer tracking for shooter position (sliding) and rotation
        this.input.on('pointermove', (pointer) => {
            if (this.levelType === 'sliding' && this.shooterTrack) {
                const A = this.shooterTrack.p1;
                const B = this.shooterTrack.p2;
                
                const vx = B.x - A.x;
                const vy = B.y - A.y;
                const lenSq = vx * vx + vy * vy;
                
                if (lenSq > 0) {
                    const ux = pointer.x - A.x;
                    const uy = pointer.y - A.y;
                    let t = (ux * vx + uy * vy) / lenSq;
                    t = Math.max(0, Math.min(1, t));
                    
                    const px = A.x + t * vx;
                    const py = A.y + t * vy;
                    
                    this.shooter.setPosition(px, py);
                }
            }
            
            const angle = Phaser.Math.Angle.Between(this.shooter.x, this.shooter.y, pointer.x, pointer.y);
            this.shooter.rotation = angle;
            this.updateBallPositions();
        });

        // Fire, Swap, or Jump on click
        this.input.on('pointerdown', (pointer, currentlyOver) => {
            if (pointer.rightButtonDown()) {
                this.swapBalls();
                return;
            }
            
            // Check if we clicked on a portal in jumping mode
            let clickedPortal = null;
            if (this.levelType === 'jumping' && currentlyOver && currentlyOver.length > 0) {
                clickedPortal = currentlyOver.find(obj => obj.texture && obj.texture.key === 'portal');
            }
            
            if (clickedPortal) {
                const targetIdx = clickedPortal.getData('index');
                const targetPos = clickedPortal.getData('position');
                this.jumpToPosition(targetPos, targetIdx);
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
        window.playerScore = this.score;
        this.updateHTMLUI();
        
        if (!this.zumaMode) {
            if (this.score >= this.zumaScore) {
                this.triggerZumaMode();
            }
        }
    }

    updateHTMLUI() {
        const scoreVal = document.getElementById('score-val');
        if (scoreVal) {
            scoreVal.innerText = this.score;
        }

        const livesVal = document.getElementById('lives-val');
        if (livesVal) {
            livesVal.innerText = '💚'.repeat(Math.max(0, window.playerLives));
        }

        const barFill = document.getElementById('zuma-bar-fill');
        if (barFill) {
            const progress = Math.min(this.score / this.zumaScore, 1);
            barFill.style.width = (progress * 100) + '%';
            
            if (!this.zumaMode) {
                // Color transition from red/orange (0% score) to green (100% score)
                const r = Math.floor(255 * (1 - progress));
                const g = Math.floor(255 * progress);
                barFill.style.backgroundColor = `rgb(${r}, ${g}, 0)`;
                barFill.style.boxShadow = `0 0 10px rgba(${r}, ${g}, 0, 0.5)`;
            }
        }
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

        // Add the CSS class to activate the glowing animation on the HTML Zuma progress bar
        const container = document.getElementById('zuma-bar-container');
        if (container) {
            container.classList.add('zuma-active');
        }
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
        const scaleCurrent = (44 / this.currentBallSprite.width) * 0.8;
        this.currentBallSprite.setScale(scaleCurrent);
        this.currentBallSprite.setDepth(4);
        
        // Head ball (depth 4)
        this.nextBallSprite = this.add.sprite(this.shooter.x, this.shooter.y, this.nextBallColor);
        const scaleNext = (44 / this.nextBallSprite.width) * 0.4;
        this.nextBallSprite.setScale(scaleNext);
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
        
        // Auto scale based on texture resolution
        const projScale = 44 / projectile.width;
        projectile.setScale(projScale);
        
        if (projectile.body) {
            // Set circle body radius 14, offset to center (22 - 14 = 8)
            // Scale body size by factor to match larger textures in physics space
            const factor = projectile.width / 44;
            projectile.body.setCircle(14 * factor, 8 * factor, 8 * factor);
            
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
        // Load the level data from the levels.js array
        const levelData = window.LEVELS[window.currentLevelIndex];
        
        if (!levelData) {
            console.error("Level data not found!");
            return;
        }

        // Parse shooter type and layout parameters
        this.levelType = levelData.type || 'stationary';
        this.shooterTrack = levelData.shooterTrack;
        this.shooterPositions = levelData.shooterPositions;

        // Set initial shooter position
        if (this.levelType === 'sliding' && this.shooterTrack) {
            const p1 = this.shooterTrack.p1;
            const p2 = this.shooterTrack.p2;
            this.shooter.setPosition((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
        } else if (this.levelType === 'jumping' && this.shooterPositions && this.shooterPositions.length > 0) {
            this.shooter.setPosition(this.shooterPositions[0].x, this.shooterPositions[0].y);
        } else {
            this.shooter.setPosition(levelData.shooter.x, levelData.shooter.y);
        }

        // Spline points for the stone path
        this.path = new Phaser.Curves.Spline(levelData.points);
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

        // Handle level loss when all balls are eaten
        if (this.chain && this.chain.state === 'GAME_OVER' && this.chain.segments.length === 0) {
            if (!this.levelLostHandled) {
                this.levelLostHandled = true;
                
                // Clear any remaining projectiles
                if (this.projectilesGroup) {
                    this.projectilesGroup.clear(true, true);
                }

                // Decrement life
                window.playerLives--;
                
                // Update HTML UI
                this.updateHTMLUI();
                
                if (window.playerLives > 0) {
                    // Show Try Again overlay
                    document.getElementById('remaining-lives-text').innerText = window.playerLives;
                    document.getElementById('try-again-screen').classList.remove('hidden');
                } else {
                    // Show Game Over overlay
                    document.getElementById('final-score-text').innerText = this.score;
                    document.getElementById('game-over-screen').classList.remove('hidden');
                }
                
                // Pause the game scene
                this.scene.pause();
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
        // Win condition: Either Zuma mode active & all balls cleared, or board cleared when playing/rollout
        const boardCleared = (this.chain && (this.chain.state === 'PLAYING' || this.chain.state === 'ROLLOUT') && visibleBallsCount === 0);

        if (boardCleared && this.chain.state !== 'GAME_OVER') {
            if (!this.levelCompleteHandled) {
                this.levelCompleteHandled = true;

                // Clean up any remaining hidden balls in the entry portal
                if (this.chain.segments.length > 0) {
                    this.chain.segments.forEach(seg => {
                        seg.balls.forEach(ball => ball.destroy());
                    });
                    this.chain.segments = [];
                }

                // Clean up any remaining projectiles
                if (this.projectilesGroup) {
                    this.projectilesGroup.clear(true, true);
                }

                // Show Level Complete overlay
                document.getElementById('complete-score-text').innerText = this.score;
                
                const nextLevelBtn = document.getElementById('next-level-btn');
                if (window.currentLevelIndex < window.LEVELS.length - 1) {
                    document.getElementById('level-complete-screen').querySelector('h2').innerText = 'Level Completed!';
                    if (nextLevelBtn) {
                        nextLevelBtn.innerText = 'Next Level';
                    }
                } else {
                    document.getElementById('level-complete-screen').querySelector('h2').innerText = 'YOU BEAT THE GAME!';
                    if (nextLevelBtn) {
                        nextLevelBtn.innerText = 'Play Again';
                    }
                }
                
                document.getElementById('level-complete-screen').classList.remove('hidden');

                // Pause the game scene
                this.scene.pause();
            }
        }
    }

    createJumpEffect(x, y) {
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const dist = 10 + Math.random() * 20;
            const px = x + Math.cos(angle) * dist;
            const py = y + Math.sin(angle) * dist;
            
            const p = this.add.sprite(px, py, 'shard');
            p.setDepth(6);
            p.setTint(0xffff00);
            p.setScale(1.5 + Math.random() * 1.5);
            
            const speed = 100 + Math.random() * 100;
            this.tweens.add({
                targets: p,
                x: px + Math.cos(angle) * speed,
                y: py + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0.1,
                duration: 500,
                ease: 'Quad.easeOut',
                onComplete: () => p.destroy()
            });
        }
    }

    jumpToPosition(targetPos, targetIdx) {
        this.createJumpEffect(this.shooter.x, this.shooter.y);
        this.shooter.setPosition(targetPos.x, targetPos.y);
        
        const pointer = this.input.activePointer;
        const angle = Phaser.Math.Angle.Between(this.shooter.x, this.shooter.y, pointer.x, pointer.y);
        this.shooter.rotation = angle;
        
        this.createJumpEffect(targetPos.x, targetPos.y);
        this.updatePortals();
        this.updateBallPositions();
    }

    updatePortals() {
        if (!this.portalsGroup) return;
        this.portalsGroup.getChildren().forEach(portal => {
            const pos = portal.getData('position');
            if (Phaser.Math.Distance.Between(this.shooter.x, this.shooter.y, pos.x, pos.y) < 5) {
                portal.setVisible(false);
                portal.disableInteractive();
            } else {
                portal.setVisible(true);
                portal.setInteractive();
            }
        });
    }
}
