class Chain {
    constructor(scene, path) {
        this.scene = scene;
        this.path = path;
        this.balls = [];
        this.colors = ['ball_red', 'ball_green', 'ball_blue', 'ball_yellow'];
        
        this.ballRadius = 16;
        this.ballSpacing = this.ballRadius * 2; // 32 pixels exactly touching
        
        this.state = 'ILLUMINATING';
        this.illuminateProgress = 0;
        this.illuminateGraphics = scene.add.graphics();
        
        this.rolloutSpeed = 250; // pixels per second
        this.normalSpeed = 40; // pixels per second
        this.targetBalls = 25; // How many balls to spawn initially
        this.spawnedBallsCount = 0;
    }

    spawnBall(distance) {
        const randomColor = Phaser.Math.RND.pick(this.colors);
        const ball = new Ball(this.scene, this.path, distance, randomColor);
        // Add to the front of the array (head of the chain is index 0)
        this.balls.push(ball);
        this.spawnedBallsCount++;
    }

    update(time, delta) {
        const dt = delta / 1000; // Delta time in seconds

        if (this.state === 'ILLUMINATING') {
            this.illuminateProgress += dt * 0.5; // Takes 2 seconds to trace the path
            
            this.illuminateGraphics.clear();
            this.illuminateGraphics.lineStyle(10, 0xffff00, 0.8);
            
            // Draw a growing line tracing the path
            const points = this.path.getSpacedPoints(100);
            const drawCount = Math.floor(points.length * this.illuminateProgress);
            
            if (drawCount > 1) {
                this.illuminateGraphics.beginPath();
                this.illuminateGraphics.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < drawCount; i++) {
                    this.illuminateGraphics.lineTo(points[i].x, points[i].y);
                }
                this.illuminateGraphics.strokePath();
            }

            if (this.illuminateProgress >= 1) {
                this.state = 'ROLLOUT';
                this.illuminateGraphics.clear(); // Hide illumination
                this.spawnBall(0); // Start the chain
            }
        } 
        else if (this.state === 'ROLLOUT' || this.state === 'PLAYING') {
            const speed = (this.state === 'ROLLOUT') ? this.rolloutSpeed : this.normalSpeed;
            
            if (this.balls.length > 0) {
                const head = this.balls[0];
                head.distance += speed * dt;
                head.updatePosition();

                // Spawn new balls if the tail has moved far enough from the start
                const tail = this.balls[this.balls.length - 1];
                if (tail.distance >= this.ballSpacing && this.spawnedBallsCount < this.targetBalls) {
                    this.spawnBall(tail.distance - this.ballSpacing);
                }

                // If in rollout and we've spawned all target balls, switch to normal speed
                if (this.state === 'ROLLOUT' && this.spawnedBallsCount >= this.targetBalls) {
                    this.state = 'PLAYING';
                }

                // Update positions of all other balls to perfectly follow the head
                for (let i = 1; i < this.balls.length; i++) {
                    const currentBall = this.balls[i];
                    const ballAhead = this.balls[i - 1];
                    
                    // Maintain exactly 32 pixels distance
                    currentBall.distance = ballAhead.distance - this.ballSpacing;
                    currentBall.updatePosition();
                }
                
                // Game Over check
                if (head.distance >= this.path.getLength()) {
                    console.log("Game Over!");
                }
            }
        }
    }

    insertBall(colorKey, hitIndex) {
        const hitBall = this.balls[hitIndex];
        
        // Insert at the hit ball's distance
        const newDist = hitBall.distance;
        const newBall = new Ball(this.scene, this.path, newDist, colorKey);
        
        this.balls.splice(hitIndex, 0, newBall);
        
        // Push everything from hitIndex + 1 (the original hit ball) backwards
        for (let i = hitIndex + 1; i < this.balls.length; i++) {
            this.balls[i].distance -= this.ballSpacing;
            this.balls[i].updatePosition();
        }
        
        // Check for matches around the inserted ball
        this.checkMatches(hitIndex);
    }

    checkMatches(startIndex) {
        const color = this.balls[startIndex].colorKey;
        let left = startIndex;
        let right = startIndex;
        
        // Find consecutive matching balls to the left
        while (left > 0 && this.balls[left - 1].colorKey === color) {
            left--;
        }
        // Find consecutive matching balls to the right
        while (right < this.balls.length - 1 && this.balls[right + 1].colorKey === color) {
            right++;
        }
        
        const count = right - left + 1;
        if (count >= 3) {
            // Destroy the matching balls
            for (let i = left; i <= right; i++) {
                this.balls[i].destroy();
            }
            
            // Remove them from the array
            this.balls.splice(left, count);
            
            // Snap the gap shut instantly
            if (left < this.balls.length) {
                // The gap size created
                const gapSize = count * this.ballSpacing;
                
                // Pull all balls behind the gap forward
                for (let i = left; i < this.balls.length; i++) {
                    this.balls[i].distance += gapSize;
                    this.balls[i].updatePosition();
                }
                
                // Combo match check! Did snapping them together create a new match?
                if (left > 0 && left < this.balls.length) {
                    if (this.balls[left - 1].colorKey === this.balls[left].colorKey) {
                        this.checkMatches(left);
                    }
                }
            }
        }
    }
}
