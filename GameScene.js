class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // Draw the background
        this.cameras.main.setBackgroundColor('#2d2d2d');

        // Setup the path
        this.createPath();

        // Initialize the ball chain
        this.chain = new Chain(this, this.path);

        // Add the shooter
        this.shooter = this.add.sprite(400, 300, 'shooter');
        
        // Firing Mechanics
        this.projectiles = [];
        this.colors = ['ball_red', 'ball_green', 'ball_blue', 'ball_yellow'];
        
        // Disable context menu for right-click
        this.input.mouse.disableContextMenu();
        
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
    }

    getAvailableColor() {
        let availableColors = this.colors;
        if (this.chain && this.chain.balls.length > 0) {
            const colorsOnBoard = new Set();
            for (let i = 0; i < this.chain.balls.length; i++) {
                colorsOnBoard.add(this.chain.balls[i].colorKey);
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
        
        // Mouth ball
        this.currentBallSprite = this.add.sprite(this.shooter.x, this.shooter.y, this.currentBallColor);
        this.currentBallSprite.setScale(0.8);
        
        // Head ball
        this.nextBallSprite = this.add.sprite(this.shooter.x, this.shooter.y, this.nextBallColor);
        this.nextBallSprite.setScale(0.4);
        
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
        const angle = this.shooter.rotation;
        const speed = 800; // Pixels per second
        
        // Start projectile from the mouth's position
        const startX = this.currentBallSprite.x;
        const startY = this.currentBallSprite.y;
        
        const projectile = this.add.sprite(startX, startY, this.currentBallColor);
        projectile.colorKey = this.currentBallColor;
        projectile.vx = Math.cos(angle) * speed;
        projectile.vy = Math.sin(angle) * speed;
        
        this.projectiles.push(projectile);
        
        this.loadNextBall();
    }

    createPath() {
        // Create a winding path using a Spline
        this.path = new Phaser.Curves.Spline([
            50, 50,
            750, 50,
            750, 550,
            50, 550,
            50, 150,
            650, 150,
            650, 450,
            150, 450,
            150, 250,
            550, 250,
            550, 350,
            250, 350
        ]);

        const graphics = this.add.graphics();
        graphics.lineStyle(20, 0x555555, 1);
        this.path.draw(graphics, 64);
        
        graphics.fillStyle(0x00ff00, 1);
        graphics.fillCircle(50, 50, 15);
        graphics.fillStyle(0xff0000, 1);
        graphics.fillCircle(250, 350, 20); // The mouth
    }

    update(time, delta) {
        if (this.chain) {
            this.chain.update(time, delta);
        }

        const dt = delta / 1000;
        
        // Update projectiles and check collisions
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            
            // Check if off screen
            if (p.x < 0 || p.x > 800 || p.y < 0 || p.y > 600) {
                p.destroy();
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Collision detection with the chain
            if (this.chain && this.chain.state === 'PLAYING') {
                for (let j = 0; j < this.chain.balls.length; j++) {
                    const cb = this.chain.balls[j];
                    const dist = Phaser.Math.Distance.Between(p.x, p.y, cb.x, cb.y);
                    
                    if (dist <= 32) { // 32 is diameter (radius * 2)
                        // Hit!
                        this.chain.insertBall(p.colorKey, j);
                        p.destroy();
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
            }
        }

        // Ensure frog doesn't hold colors that no longer exist on the board
        if (this.chain && this.chain.balls.length > 0) {
            const colorsOnBoard = new Set();
            for (let i = 0; i < this.chain.balls.length; i++) {
                colorsOnBoard.add(this.chain.balls[i].colorKey);
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
    }
}
