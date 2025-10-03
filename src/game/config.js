import Phaser from 'phaser';

// Dynamically calculate dimensions based on window size
const aspectRatio = window.innerHeight / window.innerWidth;
const isPortrait = aspectRatio > 1;
const baseWidth = isPortrait ? Math.min(768, window.innerWidth) : Math.min(1024, window.innerWidth);
const baseHeight = isPortrait ? Math.min(1024, window.innerHeight) : Math.min(768, window.innerHeight);

export const GAME_CONFIG = {
  // Dynamic dimensions based on viewport
  width: baseWidth,
  height: baseHeight,
  hudHeight: Math.floor(baseHeight * 0.12),  // 12% of height for HUD
  gameplayHeight: Math.floor(baseHeight * 0.88),  // 88% for gameplay
  lanes: 4,
  tileWidth: baseWidth / 4,
  tileHeight: Math.floor(baseHeight * 0.1),  // 10% of height per tile
  tileSpeed: Math.floor(baseHeight * 0.3),  // Speed relative to screen
  spawnInterval: 1000,
  colors: {
    green: 0x00ff88,
    blue: 0x00ccff,
    background: 0x0a0e27,
    hudBackground: 0x151937,
    miss: 0xff3366,
    accent: 0xff6b9d,
    gold: 0xffd700,
    purple: 0x9b59ff,
    darkPurple: 0x2e1a47
  }
};

export const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-container',
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.NONE,  // Changed to NONE to prevent margin-left
    width: GAME_CONFIG.width,
    height: GAME_CONFIG.height,
    parent: 'phaser-container',
    expandParent: false,
    min: {
      width: 320,
      height: 480
    },
    max: {
      width: 2048,
      height: 2732
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