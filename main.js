window.currentLevelIndex = 0;
window.playerLives = 3;
window.playerScore = 0;

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [ BootScene, GameScene ]
};

window.game = new Phaser.Game(config);
