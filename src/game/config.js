import Phaser from 'phaser';

export const GAME_CONFIG = {
  // Base dimensions for iPad Pro (3:4 aspect ratio)
  baseWidth: 1024,
  baseHeight: 1366,
  // Actual canvas dimensions will be scaled
  width: 768,  // Default width for tablets
  height: 1024,  // Default height for tablets
  hudHeight: 120,  // Larger HUD for tablet
  gameplayHeight: 904,  // Remaining space for gameplay
  lanes: 4,
  tileWidth: 192,  // 768 / 4 lanes
  tileHeight: 120,  // Larger for better touch targets
  tileSpeed: 300,  // Adjusted for larger screen
  spawnInterval: 1000,
  colors: {
    green: 0x00ff00,
    blue: 0x0099ff,
    background: 0x1a1a1a,
    hudBackground: 0x2a2a2a,
    miss: 0xff0000
  }
};

export const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-container',
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    min: {
      width: 400,
      height: 600
    },
    max: {
      width: 1024,
      height: 1366
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  backgroundColor: GAME_CONFIG.colors.background
};