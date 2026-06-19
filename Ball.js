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
}
