import Phaser from 'phaser';
import { TEXT_STYLES } from '../styles';

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
      ...TEXT_STYLES.title,
      fill: '#ff3366'
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setShadow(0, 8, '#990022', 20, true, true);

    const scoreText = this.add.text(width / 2, height / 2, `Final Score: ${this.finalScore}`, {
      ...TEXT_STYLES.button,
      fontSize: '48px',
      fill: '#ffd700'
    });
    scoreText.setOrigin(0.5);
    scoreText.setShadow(0, 4, '#ff6600', 15, true, true);

    // Retry button with gradient background
    const retryBg = this.add.graphics();
    const retryWidth = 280;
    const retryHeight = 100;
    const retryX = width / 2 - retryWidth / 2;
    const retryY = height * 0.65 - retryHeight / 2;
    
    retryBg.fillGradientStyle(0x00ccff, 0x00ccff, 0x0099cc, 0x0099cc, 1);
    retryBg.fillRoundedRect(retryX, retryY, retryWidth, retryHeight, 20);
    
    const retryButton = this.add.text(width / 2, height * 0.65, 'RETRY', TEXT_STYLES.button);
    retryButton.setOrigin(0.5);
    retryButton.setShadow(0, 4, '#000066', 12, true, true);
    retryButton.setInteractive({ useHandCursor: true });

    retryButton.on('pointerover', () => {
      retryButton.setScale(1.1);
      retryBg.clear();
      retryBg.fillGradientStyle(0x33ddff, 0x33ddff, 0x00aadd, 0x00aadd, 1);
      retryBg.fillRoundedRect(retryX, retryY, retryWidth, retryHeight, 20);
    });

    retryButton.on('pointerout', () => {
      retryButton.setScale(1);
      retryBg.clear();
      retryBg.fillGradientStyle(0x00ccff, 0x00ccff, 0x0099cc, 0x0099cc, 1);
      retryBg.fillRoundedRect(retryX, retryY, retryWidth, retryHeight, 20);
    });

    retryButton.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    // Menu button with gradient
    const menuBg = this.add.graphics();
    const menuWidth = 220;
    const menuHeight = 80;
    const menuX = width / 2 - menuWidth / 2;
    const menuY = height * 0.8 - menuHeight / 2;
    
    menuBg.fillGradientStyle(0x9b59ff, 0x9b59ff, 0x7744cc, 0x7744cc, 1);
    menuBg.fillRoundedRect(menuX, menuY, menuWidth, menuHeight, 16);
    
    const menuButton = this.add.text(width / 2, height * 0.8, 'MAIN MENU', {
      ...TEXT_STYLES.button,
      fontSize: '36px'
    });
    menuButton.setOrigin(0.5);
    menuButton.setShadow(0, 3, '#4422aa', 10, true, true);
    menuButton.setInteractive({ useHandCursor: true });

    menuButton.on('pointerover', () => {
      menuButton.setScale(1.05);
      menuBg.clear();
      menuBg.fillGradientStyle(0xb47fff, 0xb47fff, 0x8855dd, 0x8855dd, 1);
      menuBg.fillRoundedRect(menuX, menuY, menuWidth, menuHeight, 16);
    });

    menuButton.on('pointerout', () => {
      menuButton.setScale(1);
      menuBg.clear();
      menuBg.fillGradientStyle(0x9b59ff, 0x9b59ff, 0x7744cc, 0x7744cc, 1);
      menuBg.fillRoundedRect(menuX, menuY, menuWidth, menuHeight, 16);
    });

    menuButton.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
}

export default GameOverScene;