class Chain {
    constructor(scene, path) {
        this.scene = scene;
        this.path = path;
        this.segments = []; // Array of { balls: [], state: 'NORMAL'|'STOPPED'|'PULLING' }
        this.colors = ['ball_red', 'ball_green', 'ball_blue', 'ball_yellow'];
        
        this.ballRadius = 16;
        this.ballSpacing = this.ballRadius * 2; // 32 pixels exactly touching
        
        this.state = 'ILLUMINATING';
        this.illuminateProgress = 0;
        this.illuminateGraphics = scene.add.graphics();
        this.ballSpacing = 36;
        this.rolloutSpeed = 500; // pixels per second (doubled)
        this.normalSpeed = 80; // pixels per second (doubled)
        this.pullSpeed = 300; // Magnetic pull backwards (doubled)
        this.targetBalls = 25; // Initial rollout burst size
        this.spawnedBallsCount = 0;
        this.zumaMode = false;
    }

    spawnBall(distance) {
        const randomColor = Phaser.Math.RND.pick(this.colors);
        const ball = new Ball(this.scene, this.path, distance, randomColor);
        this.spawnedBallsCount++;
        
        if (this.segments.length === 0) {
            this.segments.push({ balls: [ball], state: 'NORMAL' });
        } else {
            const pusher = this.segments[this.segments.length - 1];
            pusher.balls.push(ball);
        }
    }

    update(time, delta) {
        const dt = delta / 1000; // Delta time in seconds

        if (this.state === 'ILLUMINATING') {
            this.illuminateProgress += dt * 0.5; // Takes 2 seconds to trace the path
            this.illuminateGraphics.clear();
            this.illuminateGraphics.lineStyle(10, 0xffff00, 0.8);
            
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
        else if (this.state === 'ROLLOUT' || this.state === 'PLAYING' || this.state === 'GAME_OVER') {
            
            // 1. Check for collisions between segments (merging)
            for (let i = this.segments.length - 2; i >= 0; i--) {
                const frontSeg = this.segments[i];
                const backSeg = this.segments[i + 1];
                
                if (frontSeg.balls.length === 0 || backSeg.balls.length === 0) continue;
                
                const frontTail = frontSeg.balls[frontSeg.balls.length - 1];
                const backHead = backSeg.balls[0];
                
                // If they touch or overlap slightly
                if (frontTail.distance - backHead.distance <= this.ballSpacing + 2) {
                    // Snap backHead to exact spacing
                    backHead.distance = frontTail.distance - this.ballSpacing;
                    
                    const mergeIndex = frontSeg.balls.length;
                    frontSeg.balls = frontSeg.balls.concat(backSeg.balls);
                    
                    // Inherit state from backSeg if it's the pusher
                    if (i + 1 === this.segments.length - 1) {
                        frontSeg.state = 'NORMAL';
                    } else {
                        frontSeg.state = 'STOPPED'; 
                    }
                    
                    this.segments.splice(i + 1, 1);
                    this.checkMatches(frontSeg, mergeIndex, true);
                } else {
                    // THEY HAVE A GAP!
                    // Dynamically check magnetic attraction every frame
                    if (frontTail.colorKey === backHead.colorKey) {
                        frontSeg.state = 'PULLING';
                    } else {
                        frontSeg.state = 'STOPPED';
                    }
                }
            }

            // 2. Move segments
            if (this.zumaPushbackTimer > 0) {
                this.zumaPushbackTimer -= dt;
            }

            for (let i = 0; i < this.segments.length; i++) {
                const seg = this.segments[i];
                if (seg.balls.length === 0) continue;
                
                let currentSpeed = 0;
                if (this.state === 'GAME_OVER') {
                    currentSpeed = 800; // Rapid eating speed (increased)
                } else if (this.zumaPushbackTimer > 0) {
                    currentSpeed = -200; // Zuma pushback!
                } else if (i === this.segments.length - 1) {
                    currentSpeed = (this.state === 'ROLLOUT') ? this.rolloutSpeed : this.normalSpeed;
                    
                    // Slow down if the head of the chain is past 80% of the path
                    if (this.state === 'PLAYING' && this.segments.length > 0 && this.segments[0].balls.length > 0) {
                        const headDistance = this.segments[0].balls[0].distance;
                        const pathLength = this.path.getLength();
                        if (headDistance > pathLength * 0.8) {
                            currentSpeed = this.normalSpeed * 0.3; // Slow down to 30% speed to build tension!
                        }
                    }
                } else if (seg.state === 'PULLING') {
                    currentSpeed = -this.pullSpeed;
                } else {
                    currentSpeed = 0; // STOPPED
                }
                
                if (currentSpeed !== 0) {
                    const head = seg.balls[0];
                    head.distance += currentSpeed * dt;
                    head.updatePosition();
                }

                // Follow head exactly
                for (let j = 1; j < seg.balls.length; j++) {
                    const currentBall = seg.balls[j];
                    const ballAhead = seg.balls[j - 1];
                    currentBall.distance = ballAhead.distance - this.ballSpacing;
                    currentBall.updatePosition();
                }
                
                // Pushback Destruction: if balls get pushed into the hole, permanently destroy them!
                if (currentSpeed < 0) {
                    for (let j = seg.balls.length - 1; j >= 0; j--) {
                        if (seg.balls[j].distance <= 0) {
                            seg.balls[j].pop();
                            seg.balls.splice(j, 1);
                            if (this.scene.addScore) this.scene.addScore(10); // Reward for pushing them back!
                        }
                    }
                }
                
                // Game Over trigger check
                if (i === 0 && seg.balls.length > 0 && this.state !== 'GAME_OVER') {
                    if (seg.balls[0].distance >= this.path.getLength()) {
                        this.state = 'GAME_OVER';
                    }
                }

                // Eat balls that reach the end
                if (this.state === 'GAME_OVER') {
                    while (seg.balls.length > 0 && seg.balls[0].distance >= this.path.getLength()) {
                        const eatenBall = seg.balls.shift();
                        eatenBall.destroy();
                    }
                }
            }

            // Clean up empty segments
            for (let i = this.segments.length - 1; i >= 0; i--) {
                if (this.segments[i].balls.length === 0) {
                    this.segments.splice(i, 1);
                }
            }

            // 3. Spawn new balls from the hole (Infinitely, until Zuma!)
            if (this.state !== 'GAME_OVER' && !this.zumaMode && this.segments.length > 0) {
                const pusher = this.segments[this.segments.length - 1];
                if (pusher.balls.length > 0) {
                    const tail = pusher.balls[pusher.balls.length - 1];
                    if (tail.distance >= this.ballSpacing) {
                        this.spawnBall(tail.distance - this.ballSpacing);
                    }
                }
            }

            if (this.state === 'ROLLOUT' && this.spawnedBallsCount >= this.targetBalls) {
                this.state = 'PLAYING';
            }
        }
    }

    insertBall(colorKey, sIndex, bIndex) {
        const seg = this.segments[sIndex];
        const hitBall = seg.balls[bIndex];
        
        // Insert at the hit ball's distance
        const newDist = hitBall.distance;
        const newBall = new Ball(this.scene, this.path, newDist, colorKey);
        
        seg.balls.splice(bIndex, 0, newBall);
        
        // Recalculate positions immediately for smooth insertion
        for (let j = 0; j < seg.balls.length; j++) {
            seg.balls[j].updatePosition();
        }

        const matchFound = this.checkMatches(seg, bIndex, false);
        if (!matchFound && this.scene.resetCombo) {
            this.scene.resetCombo();
        }
    }

    checkMatches(seg, index, isCascade = true) {
        if (index < 0 || index >= seg.balls.length) return false;
        
        const targetColor = seg.balls[index].colorKey;
        let left = index;
        let right = index;
        
        // Find left bounds
        while (left > 0 && seg.balls[left - 1].colorKey === targetColor) {
            left--;
        }
        
        // Find right bounds
        while (right < seg.balls.length - 1 && seg.balls[right + 1].colorKey === targetColor) {
            right++;
        }
        
        const count = right - left + 1;
        if (count >= 3) {
            const matchX = seg.balls[index].x;
            const matchY = seg.balls[index].y;

            // Award points and combos!
            if (this.scene.onMatchMade) {
                this.scene.onMatchMade(count, isCascade, matchX, matchY);
            }

            // Destroy the matching balls with pop animation
            for (let i = left; i <= right; i++) {
                seg.balls[i].pop();
            }
            
            // Remove from array
            seg.balls.splice(left, count);
            
            // If the segment was split in half by the pop, split it into two segments
            if (left > 0 && left < seg.balls.length) {
                const backHalf = seg.balls.splice(left);
                const newSeg = { balls: backHalf, state: 'NORMAL' };
                this.segments.splice(this.segments.indexOf(seg) + 1, 0, newSeg);
            }

            return true;
        }
        
        return false;
    }
}
