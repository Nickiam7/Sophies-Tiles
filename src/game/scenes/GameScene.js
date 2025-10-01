import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init() {
    // Reset all game state when scene starts/restarts
    this.score = 0;
    this.combo = 0;
    this.lives = 3;
    this.tiles = [];
    this.tilePool = [];
    this.isGameOver = false;
    this.gameSpeed = GAME_CONFIG.tileSpeed;
    this.spawnTimer = 0;
    this.holdingTiles = new Map();
  }

  create() {
    this.setupLanes();
    this.setupInput();
    this.setupUI();
    this.time.addEvent({
      delay: GAME_CONFIG.spawnInterval,
      callback: this.spawnTile,
      callbackScope: this,
      loop: true
    });
  }

  setupLanes() {
    const laneWidth = GAME_CONFIG.width / GAME_CONFIG.lanes;
    
    for (let i = 0; i < GAME_CONFIG.lanes; i++) {
      const x = i * laneWidth + laneWidth / 2;
      const lane = this.add.graphics();
      lane.lineStyle(2, 0x444444);
      lane.lineBetween(i * laneWidth, 0, i * laneWidth, GAME_CONFIG.height);
    }

    const hitZone = this.add.graphics();
    hitZone.fillStyle(0x00ff00, 0.2);
    hitZone.fillRect(0, GAME_CONFIG.height - 100, GAME_CONFIG.width, 100);
  }

  setupInput() {
    // Set up lane-based input (only as fallback when not clicking tiles directly)
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    
    const keys = ['A', 'S', 'D', 'F'];
    this.keyboardKeys = {};
    
    keys.forEach((key, index) => {
      this.keyboardKeys[key] = this.input.keyboard.addKey(key);
      this.keyboardKeys[key].on('down', () => this.handleLanePress(index));
      this.keyboardKeys[key].on('up', () => this.handleLaneRelease(index));
    });
  }

  setupUI() {
    this.scoreText = this.add.text(10, 10, 'Score: 0', {
      fontSize: '24px',
      fill: '#ffffff'
    });

    this.comboText = this.add.text(10, 40, 'Combo: 0', {
      fontSize: '20px',
      fill: '#ffff00'
    });

    this.livesText = this.add.text(10, 70, 'Lives: 3', {
      fontSize: '20px',
      fill: '#ff6666'
    });
  }

  spawnTile() {
    if (this.isGameOver) return;

    const lane = Phaser.Math.Between(0, GAME_CONFIG.lanes - 1);
    const isLongTile = Math.random() < 0.2;
    const tile = this.createTile(lane, isLongTile);
    
    this.tiles.push(tile);
  }

  createTile(lane, isLongTile = false) {
    const laneWidth = GAME_CONFIG.width / GAME_CONFIG.lanes;
    const x = lane * laneWidth + laneWidth / 2;
    const y = -GAME_CONFIG.tileHeight;

    const tileHeight = isLongTile ? GAME_CONFIG.tileHeight * 2 : GAME_CONFIG.tileHeight;
    const color = isLongTile ? GAME_CONFIG.colors.blue : GAME_CONFIG.colors.green;

    // Create an invisible interactive rectangle for the tile
    const hitArea = this.add.rectangle(x, y + tileHeight/2, GAME_CONFIG.tileWidth - 10, tileHeight);
    hitArea.setInteractive();
    hitArea.setAlpha(0.01); // Almost invisible but still interactive
    
    const tile = this.add.graphics();
    tile.fillStyle(color, 0.9);
    tile.fillRoundedRect(-GAME_CONFIG.tileWidth/2, 0, GAME_CONFIG.tileWidth - 10, tileHeight, 8);
    
    if (isLongTile) {
      const holdText = this.add.text(0, tileHeight/2, '⬆ HOLD ⬆', {
        fontSize: '16px',
        fill: '#ffffff',
        fontStyle: 'bold'
      });
      holdText.setOrigin(0.5);
      tile.holdText = holdText;
    }

    tile.x = x;
    tile.y = y;
    tile.lane = lane;
    tile.isLongTile = isLongTile;
    tile.tileHeight = tileHeight;
    tile.isHit = false;
    tile.holdProgress = 0;
    tile.hitArea = hitArea;
    tile.isHolding = false;

    // Add event listeners to the hit area
    hitArea.on('pointerdown', () => {
      if (!tile.isHit) {
        if (tile.isLongTile) {
          this.holdingTiles.set(lane, tile);
          tile.isHolding = true;
        } else {
          this.hitTile(tile);
        }
      }
    });

    hitArea.on('pointerup', () => {
      if (tile.isLongTile && tile.isHolding) {
        tile.isHolding = false;
        const progress = tile.holdProgress / tile.tileHeight;
        this.score += Math.floor(20 * progress);
        
        if (progress >= 0.8) {
          this.combo++;
          this.hitTile(tile);
        } else {
          this.combo = 0;
        }
        
        this.holdingTiles.delete(lane);
        this.updateUI();
      }
    });

    hitArea.on('pointerout', () => {
      if (tile.isLongTile && tile.isHolding) {
        tile.isHolding = false;
        const progress = tile.holdProgress / tile.tileHeight;
        this.score += Math.floor(20 * progress);
        
        if (progress >= 0.8) {
          this.combo++;
          this.hitTile(tile);
        } else {
          this.combo = 0;
        }
        
        this.holdingTiles.delete(lane);
        this.updateUI();
      }
    });

    return tile;
  }

  handlePointerDown(pointer) {
    const lane = Math.floor(pointer.x / (GAME_CONFIG.width / GAME_CONFIG.lanes));
    this.handleLanePress(lane);
  }

  handlePointerUp(pointer) {
    const lane = Math.floor(pointer.x / (GAME_CONFIG.width / GAME_CONFIG.lanes));
    this.handleLaneRelease(lane);
  }

  handleLanePress(lane) {
    if (lane < 0 || lane >= GAME_CONFIG.lanes) return;

    const hitZoneTop = GAME_CONFIG.height - 150;
    const hitZoneBottom = GAME_CONFIG.height;

    for (let tile of this.tiles) {
      if (tile.isHit || tile.lane !== lane) continue;

      const tileBottom = tile.y + tile.tileHeight;
      const tileTop = tile.y;

      if (tileBottom >= hitZoneTop && tileTop <= hitZoneBottom) {
        if (tile.isLongTile) {
          this.holdingTiles.set(lane, tile);
          tile.fillStyle(GAME_CONFIG.colors.blue, 0.5);
        } else {
          this.hitTile(tile);
        }
        break;
      }
    }
  }

  handleLaneRelease(lane) {
    const holdingTile = this.holdingTiles.get(lane);
    if (holdingTile) {
      const progress = holdingTile.holdProgress / holdingTile.tileHeight;
      this.score += Math.floor(20 * progress);
      
      if (progress >= 0.8) {
        this.combo++;
        this.hitTile(holdingTile);
      } else {
        this.combo = 0;
      }
      
      this.holdingTiles.delete(lane);
      this.updateUI();
    }
  }

  hitTile(tile) {
    if (tile.isHit) return;
    
    tile.isHit = true;
    this.score += 10 * Math.max(1, Math.floor(this.combo / 5));
    this.combo++;

    const hitEffect = this.add.graphics();
    hitEffect.fillStyle(0xffffff, 0.8);
    hitEffect.fillCircle(tile.x, tile.y + tile.tileHeight/2, 30);
    
    this.tweens.add({
      targets: hitEffect,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => hitEffect.destroy()
    });

    tile.destroy();
    if (tile.holdText) tile.holdText.destroy();
    if (tile.hitArea) tile.hitArea.destroy();
    
    this.updateUI();
  }

  update() {
    if (this.isGameOver) return;

    this.tiles = this.tiles.filter(tile => {
      if (tile.isHit) return false;

      tile.y += this.gameSpeed * this.game.loop.delta / 1000;
      
      // Move the hit area with the tile
      if (tile.hitArea) {
        tile.hitArea.y = tile.y + tile.tileHeight/2;
      }
      
      if (tile.holdText) {
        tile.holdText.x = tile.x;
        tile.holdText.y = tile.y + tile.tileHeight/2;
      }

      // Handle hold progress for tiles being held (either directly or through lane system)
      if ((tile.isHolding) || (this.holdingTiles.has(tile.lane) && this.holdingTiles.get(tile.lane) === tile)) {
        tile.holdProgress = Math.min(tile.holdProgress + this.gameSpeed * this.game.loop.delta / 1000, tile.tileHeight);
        
        const progressHeight = tile.holdProgress;
        tile.clear();
        tile.fillStyle(GAME_CONFIG.colors.blue, 0.5);
        tile.fillRoundedRect(-GAME_CONFIG.tileWidth/2, 0, GAME_CONFIG.tileWidth - 10, tile.tileHeight, 8);
        tile.fillStyle(0x00ffff, 0.9);
        tile.fillRoundedRect(-GAME_CONFIG.tileWidth/2, tile.tileHeight - progressHeight, GAME_CONFIG.tileWidth - 10, progressHeight, 8);
      }

      if (tile.y > GAME_CONFIG.height) {
        this.missTile(tile);
        return false;
      }

      return true;
    });

    if (this.game.loop.frame % 600 === 0) {
      this.gameSpeed = Math.min(this.gameSpeed + 10, 500);
    }
  }

  missTile(tile) {
    this.combo = 0;
    this.lives--;
    
    this.cameras.main.shake(200, 0.01);
    
    const missEffect = this.add.graphics();
    missEffect.fillStyle(GAME_CONFIG.colors.miss, 0.3);
    missEffect.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    
    this.tweens.add({
      targets: missEffect,
      alpha: 0,
      duration: 300,
      onComplete: () => missEffect.destroy()
    });

    tile.destroy();
    if (tile.holdText) tile.holdText.destroy();
    if (tile.hitArea) tile.hitArea.destroy();
    
    this.updateUI();

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  updateUI() {
    this.scoreText.setText(`Score: ${this.score}`);
    this.comboText.setText(`Combo: ${this.combo}`);
    this.livesText.setText(`Lives: ${this.lives}`);
  }

  gameOver() {
    this.isGameOver = true;
    
    // Clean up all tiles
    this.tiles.forEach(tile => {
      if (tile.hitArea) tile.hitArea.destroy();
      if (tile.holdText) tile.holdText.destroy();
      tile.destroy();
    });
    
    // Clear the tiles array
    this.tiles = [];
    
    // Clear any timers
    this.time.removeAllEvents();

    this.scene.start('GameOverScene', { score: this.score });
  }
}

export default GameScene;