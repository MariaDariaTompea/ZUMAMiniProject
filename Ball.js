class Ball extends Phaser.GameObjects.Sprite {
    constructor(scene, path, distance, colorKey) {
        super(scene, 0, 0, colorKey);
        this.scene = scene;
        this.path = path;
        this.distance = distance; // Position along the path in pixels
        this.colorKey = colorKey;
        
        // Add to scene
        scene.add.existing(this);
        
        // Initial position
        this.updatePosition();
    }

    updatePosition() {
        const pathLength = this.path.getLength();
        let u = this.distance / pathLength;
        
        // If a ball is pushed backwards past the start (into the hole), hide it
        if (u < 0) {
            this.setVisible(false);
            return;
        } else if (u > 1) {
            u = 1;
        }
        
        const point = this.path.getPointAt(u);
        if (point) {
            this.x = point.x;
            this.y = point.y;
            this.setVisible(true);
        }
    }

    pop() {
        const colorMap = {
            'ball_red': 0xff0000,
            'ball_green': 0x00ff00,
            'ball_blue': 0x0000ff,
            'ball_yellow': 0xffff00
        };
        const tintColor = colorMap[this.texture.key] || 0xffffff;

        const emitter = this.scene.add.particles(this.x, this.y, 'shard', {
            tint: tintColor,
            speed: { min: 100, max: 350 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.5, end: 0 },
            alpha: { start: 1, end: 0 },
            rotate: { min: 0, max: 720 },
            lifespan: 300,
            blendMode: 'NORMAL'
        });

        emitter.explode(15);

        this.scene.time.delayedCall(400, () => {
            emitter.destroy();
        });

        this.setVisible(false);
        this.destroy();
    }
}
