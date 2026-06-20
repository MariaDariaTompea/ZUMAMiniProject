window.currentLevelIndex = 0;

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [ BootScene, GameScene ]
};

const game = new Phaser.Game(config);
