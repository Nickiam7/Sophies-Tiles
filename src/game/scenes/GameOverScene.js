import Phaser from 'phaser';

class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
  }

  create() {
    const { width, height } = this.cameras.main;

    const gameOverText = this.add.text(width / 2, height / 3, 'GAME OVER', {
      fontSize: '72px',
      fill: '#ff0000',
      fontStyle: 'bold'
    });
    gameOverText.setOrigin(0.5);

    const scoreText = this.add.text(width / 2, height / 2, `Final Score: ${this.finalScore}`, {
      fontSize: '48px',
      fill: '#ffffff'
    });
    scoreText.setOrigin(0.5);

    const retryButton = this.add.text(width / 2, height * 0.65, 'RETRY', {
      fontSize: '56px',
      fill: '#00ff00',
      backgroundColor: '#333333',
      padding: { x: 40, y: 20 }
    });
    retryButton.setOrigin(0.5);
    retryButton.setInteractive({ useHandCursor: true });

    retryButton.on('pointerover', () => {
      retryButton.setScale(1.1);
    });

    retryButton.on('pointerout', () => {
      retryButton.setScale(1);
    });

    retryButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    const menuButton = this.add.text(width / 2, height * 0.8, 'MAIN MENU', {
      fontSize: '36px',
      fill: '#aaaaaa',
      backgroundColor: '#222222',
      padding: { x: 30, y: 15 }
    });
    menuButton.setOrigin(0.5);
    menuButton.setInteractive({ useHandCursor: true });

    menuButton.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}

export default GameOverScene;