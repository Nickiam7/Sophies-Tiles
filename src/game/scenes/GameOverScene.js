import Phaser from 'phaser';
import { TEXT_STYLES } from '../styles';

class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.finalScore = data.score || 0;
    
    // Completely stop the GameScene to ensure clean restart
    if (this.scene.get('GameScene')) {
      this.scene.stop('GameScene');
    }
  }

  create() {
    const { width, height } = this.cameras.main;
    
    // Fade in effect
    this.cameras.main.fadeIn(300, 0, 0, 0);
    
    // Add subtle border/glow around the entire scene
    const border = this.add.graphics();
    border.lineStyle(3, 0xff3366, 0.3);
    border.strokeRect(10, 10, width - 20, height - 20);
    
    // Add inner glow
    const innerGlow = this.add.graphics();
    innerGlow.lineStyle(2, 0xff6b9d, 0.2);
    innerGlow.strokeRect(15, 15, width - 30, height - 30);

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
    retryBg.fillRect(retryX, retryY, retryWidth, retryHeight);
    
    const retryButton = this.add.text(width / 2, height * 0.65, 'RETRY', TEXT_STYLES.button);
    retryButton.setOrigin(0.5);
    retryButton.setShadow(0, 4, '#000066', 12, true, true);
    retryButton.setInteractive({ useHandCursor: true });

    retryButton.on('pointerover', () => {
      this.tweens.add({
        targets: retryButton,
        scale: 1.1,
        duration: 200,
        ease: 'Power2'
      });
      retryBg.clear();
      retryBg.fillGradientStyle(0x33ddff, 0x33ddff, 0x00aadd, 0x00aadd, 1);
      retryBg.fillRect(retryX, retryY, retryWidth, retryHeight);
    });

    retryButton.on('pointerout', () => {
      this.tweens.add({
        targets: retryButton,
        scale: 1,
        duration: 200,
        ease: 'Power2'
      });
      retryBg.clear();
      retryBg.fillGradientStyle(0x00ccff, 0x00ccff, 0x0099cc, 0x0099cc, 1);
      retryBg.fillRect(retryX, retryY, retryWidth, retryHeight);
    });

    retryButton.on('pointerdown', () => {
      // Press animation
      this.tweens.add({
        targets: retryButton,
        scale: 0.95,
        duration: 100,
        yoyo: true,
        ease: 'Power2',
        onComplete: () => {
          // Fade out before scene transition
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            // Get the game scene and restart it completely
            const gameScene = this.scene.get('GameScene');
            if (gameScene && gameScene.scene) {
              gameScene.scene.restart();
            } else {
              this.scene.start('GameScene');
            }
            this.scene.stop('GameOverScene');
          });
        }
      });
    });

    // Menu button with gradient
    const menuBg = this.add.graphics();
    const menuWidth = 220;
    const menuHeight = 80;
    const menuX = width / 2 - menuWidth / 2;
    const menuY = height * 0.8 - menuHeight / 2;
    
    menuBg.fillGradientStyle(0x9b59ff, 0x9b59ff, 0x7744cc, 0x7744cc, 1);
    menuBg.fillRect(menuX, menuY, menuWidth, menuHeight);
    
    const menuButton = this.add.text(width / 2, height * 0.8, 'MAIN MENU', {
      ...TEXT_STYLES.button,
      fontSize: '36px'
    });
    menuButton.setOrigin(0.5);
    menuButton.setShadow(0, 3, '#4422aa', 10, true, true);
    menuButton.setInteractive({ useHandCursor: true });

    menuButton.on('pointerover', () => {
      this.tweens.add({
        targets: menuButton,
        scale: 1.05,
        duration: 200,
        ease: 'Power2'
      });
      menuBg.clear();
      menuBg.fillGradientStyle(0xb47fff, 0xb47fff, 0x8855dd, 0x8855dd, 1);
      menuBg.fillRect(menuX, menuY, menuWidth, menuHeight);
    });

    menuButton.on('pointerout', () => {
      this.tweens.add({
        targets: menuButton,
        scale: 1,
        duration: 200,
        ease: 'Power2'
      });
      menuBg.clear();
      menuBg.fillGradientStyle(0x9b59ff, 0x9b59ff, 0x7744cc, 0x7744cc, 1);
      menuBg.fillRect(menuX, menuY, menuWidth, menuHeight);
    });

    menuButton.on('pointerdown', () => {
      // Press animation
      this.tweens.add({
        targets: menuButton,
        scale: 0.95,
        duration: 100,
        yoyo: true,
        ease: 'Power2',
        onComplete: () => {
          // Fade out before scene transition
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            // Stop GameScene when going to menu
            if (this.scene.get('GameScene')) {
              this.scene.stop('GameScene');
            }
            this.scene.start('MenuScene');
          });
        }
      });
    });
  }
}

export default GameOverScene;