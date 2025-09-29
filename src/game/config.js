import Phaser from 'phaser';

export const GAME_CONFIG = {
  width: 400,
  height: 600,
  lanes: 4,
  tileWidth: 100,
  tileHeight: 80,
  tileSpeed: 200,
  spawnInterval: 1000,
  colors: {
    green: 0x00ff00,
    blue: 0x0099ff,
    background: 0x1a1a1a,
    miss: 0xff0000
  }
};

export const phaserConfig = {
  type: Phaser.AUTO,
  parent: 'phaser-container',
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  backgroundColor: GAME_CONFIG.colors.background
};