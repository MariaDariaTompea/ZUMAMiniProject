const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scene: [ BootScene, GameScene ]
};

const game = new Phaser.Game(config);
