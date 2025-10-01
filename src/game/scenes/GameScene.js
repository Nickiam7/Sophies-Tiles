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
    
    // Level system
    this.currentLevel = 1;
    this.maxLevel = 5;
    this.levelDuration = 20000; // 20 seconds per level
    this.levelStartTime = 0;
    this.levelProgress = 0;
    this.isTransitioningLevel = false;
    this.baseSpeed = GAME_CONFIG.tileSpeed;
    this.speedMultiplier = 1.25; // 25% speed increase per level
  }

  create() {
    this.createHUD();
    this.setupLanes();
    this.setupInput();
    this.setupUI();
    this.setupLevelUI();
    
    // Reset level display and progress for fresh start
    this.levelProgress = 0;
    this.currentLevel = 1;
    this.gameSpeed = this.baseSpeed;  // Reset to base speed for level 1
    this.updateProgressBar(0);
    
    // Start level timer
    this.levelStartTime = this.time.now;
    
    // Start spawning tiles
    this.time.addEvent({
      delay: GAME_CONFIG.spawnInterval,
      callback: this.spawnTile,
      callbackScope: this,
      loop: true
    });
  }

  createHUD() {
    // Create HUD background with high depth to render on top
    const hudBg = this.add.graphics();
    hudBg.fillStyle(GAME_CONFIG.colors.hudBackground, 1);
    hudBg.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.hudHeight);
    
    // Add separator line
    hudBg.lineStyle(2, 0x444444);
    hudBg.lineBetween(0, GAME_CONFIG.hudHeight, GAME_CONFIG.width, GAME_CONFIG.hudHeight);
    
    // Set high depth so HUD renders above tiles
    hudBg.setDepth(100);
  }

  setupLanes() {
    const laneWidth = GAME_CONFIG.width / GAME_CONFIG.lanes;
    const gameplayStart = GAME_CONFIG.hudHeight;
    const gameplayEnd = GAME_CONFIG.height;

    for (let i = 0; i < GAME_CONFIG.lanes; i++) {
      const x = i * laneWidth + laneWidth / 2;
      const lane = this.add.graphics();
      lane.lineStyle(2, 0x444444);
      lane.lineBetween(i * laneWidth, gameplayStart, i * laneWidth, gameplayEnd);
    }

    const hitZone = this.add.graphics();
    hitZone.fillStyle(0xff0000, 0.2);  // Red danger zone
    hitZone.fillRect(0, gameplayEnd - 100, GAME_CONFIG.width, 100);
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
    // Score on left - label and value stacked
    this.scoreLabel = this.add.text(40, 25, 'SCORE', {
      fontSize: '14px',
      fill: '#aaaaaa'
    });
    this.scoreLabel.setOrigin(0.5, 0);
    this.scoreLabel.setDepth(101);
    
    this.scoreText = this.add.text(40, 45, '0', {
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold'
    });
    this.scoreText.setOrigin(0.5, 0);
    this.scoreText.setDepth(101);

    // Lives on right - label and value stacked
    const { width } = this.cameras.main;
    this.livesLabel = this.add.text(width - 40, 25, 'LIVES', {
      fontSize: '14px',
      fill: '#aaaaaa'
    });
    this.livesLabel.setOrigin(0.5, 0);
    this.livesLabel.setDepth(101);
    
    this.livesText = this.add.text(width - 40, 45, '3', {
      fontSize: '24px',
      fill: '#ff6666',
      fontStyle: 'bold'
    });
    this.livesText.setOrigin(0.5, 0);
    this.livesText.setDepth(101);
  }

  setupLevelUI() {
    const { width } = this.cameras.main;
    
    // Level indicator in HUD
    this.levelText = this.add.text(width / 2, 10, `LEVEL ${this.currentLevel}`, {
      fontSize: '22px',
      fill: '#00ffff',
      fontStyle: 'bold'
    });
    this.levelText.setOrigin(0.5, 0);
    this.levelText.setDepth(101);
    
    // Progress bar in HUD
    const progressBarWidth = 160;
    const progressBarHeight = 14;
    const progressBarX = width / 2 - progressBarWidth / 2;
    const progressBarY = 40;
    
    this.progressBarBg = this.add.graphics();
    this.progressBarBg.fillStyle(0x333333, 0.8);
    this.progressBarBg.fillRoundedRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 5);
    this.progressBarBg.setDepth(101);
    
    // Progress bar fill
    this.progressBarFill = this.add.graphics();
    this.progressBarFill.setDepth(101);
    
    // Progress segments (25% marks)
    for (let i = 1; i < 4; i++) {
      const segmentX = progressBarX + (progressBarWidth * i / 4);
      const segment = this.add.graphics();
      segment.lineStyle(2, 0x000000);
      segment.lineBetween(segmentX, progressBarY, segmentX, progressBarY + progressBarHeight);
      segment.setDepth(102);
    }

    // Streak below progress bar
    this.comboText = this.add.text(width / 2, 65, 'Streak: 0', {
      fontSize: '18px',
      fill: '#ffff00'
    });
    this.comboText.setOrigin(0.5, 0);
    this.comboText.setDepth(101);
    
    // Initialize progress bar with 0
    this.updateProgressBar(0);
  }

  updateProgressBar(progress) {
    // Safety check - only update if progress bar exists
    if (!this.progressBarFill) return;
    
    const { width } = this.cameras.main;
    const progressBarWidth = 160;
    const progressBarHeight = 14;
    const progressBarX = width / 2 - progressBarWidth / 2;
    const progressBarY = 40;
    
    this.progressBarFill.clear();
    this.progressBarFill.fillStyle(0x00ff00, 1);
    const fillWidth = progressBarWidth * progress;
    if (fillWidth > 0) {
      this.progressBarFill.fillRoundedRect(progressBarX, progressBarY, fillWidth, progressBarHeight, 5);
    }
  }

  spawnTile() {
    if (this.isGameOver || this.isTransitioningLevel) return;

    const lane = Phaser.Math.Between(0, GAME_CONFIG.lanes - 1);
    const isLongTile = Math.random() < 0.2;
    const tile = this.createTile(lane, isLongTile);

    this.tiles.push(tile);
  }

  createTile(lane, isLongTile = false) {
    const laneWidth = GAME_CONFIG.width / GAME_CONFIG.lanes;
    const x = lane * laneWidth + laneWidth / 2;
    const y = GAME_CONFIG.hudHeight - GAME_CONFIG.tileHeight;  // Start tiles just above HUD

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

    // Check for streak milestones (every 10)
    if (this.combo % 10 === 0) {
      this.celebrateStreakMilestone(this.combo);
    }

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

  celebrateStreakMilestone(streak) {
    const { width, height } = this.cameras.main;
    
    // Choose encouraging message based on streak level
    const messages = [
      "Great job! Keep going!",
      "Amazing streak!",
      "You're on fire! 🔥",
      "Incredible rhythm!",
      "Unstoppable!",
      "Perfect timing!",
      "Keep the streak alive!"
    ];
    const message = streak >= 50 ? "LEGENDARY STREAK! 🌟" : messages[Math.floor(Math.random() * messages.length)];
    
    // Create celebration text
    const celebrationText = this.add.text(width / 2, height / 2 - 100, `${streak} STREAK!`, {
      fontSize: '48px',
      fill: '#ffff00',
      fontStyle: 'bold',
      stroke: '#ff6600',
      strokeThickness: 6
    });
    celebrationText.setOrigin(0.5);
    celebrationText.setDepth(1000);
    
    // Create encouraging message
    const encourageText = this.add.text(width / 2, height / 2 - 40, message, {
      fontSize: '28px',
      fill: '#ffffff',
      fontStyle: 'bold'
    });
    encourageText.setOrigin(0.5);
    encourageText.setDepth(1000);
    
    // Create particle burst effect
    for (let i = 0; i < 12; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(Phaser.Math.Between(0, 1) ? 0xffff00 : 0xff6600, 1);
      particle.fillCircle(0, 0, Phaser.Math.Between(4, 8));
      particle.x = width / 2;
      particle.y = height / 2 - 70;
      
      const angle = (i / 12) * Math.PI * 2;
      const distance = Phaser.Math.Between(100, 200);
      
      this.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * distance,
        y: particle.y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: 1000,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy()
      });
    }
    
    // Animate the text
    this.tweens.add({
      targets: celebrationText,
      scale: { from: 0, to: 1.2 },
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: celebrationText,
          y: celebrationText.y - 50,
          alpha: 0,
          duration: 1000,
          delay: 1000,
          onComplete: () => celebrationText.destroy()
        });
      }
    });
    
    this.tweens.add({
      targets: encourageText,
      scale: { from: 0, to: 1 },
      duration: 400,
      delay: 100,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: encourageText,
          y: encourageText.y - 50,
          alpha: 0,
          duration: 1000,
          delay: 900,
          onComplete: () => encourageText.destroy()
        });
      }
    });
    
    // Screen flash effect
    const flash = this.add.rectangle(width / 2, height / 2, width, height, 0xffffff);
    flash.setAlpha(0.3);
    flash.setDepth(999);
    
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy()
    });
    
    // Slight camera zoom effect
    this.cameras.main.zoom = 1.05;
    this.tweens.add({
      targets: this.cameras.main,
      zoom: 1,
      duration: 300,
      ease: 'Cubic.easeOut'
    });
  }

  update() {
    if (this.isGameOver) return;

    // Update level progress
    if (!this.isTransitioningLevel) {
      const elapsed = this.time.now - this.levelStartTime;
      this.levelProgress = Math.min(elapsed / this.levelDuration, 1);
      this.updateProgressBar(this.levelProgress);
      
      // Check for level completion
      if (this.levelProgress >= 1) {
        if (this.currentLevel < this.maxLevel) {
          this.startLevelTransition();
        } else if (this.currentLevel === this.maxLevel) {
          // Victory after completing all 5 levels!
          this.gameVictory();
        }
      }
    }

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

    // Don't do incremental speed changes anymore - speed is controlled by level
  }

  startLevelTransition() {
    this.isTransitioningLevel = true;
    
    // Clear all tiles on screen
    this.tiles.forEach(tile => {
      if (tile.hitArea) tile.hitArea.destroy();
      if (tile.holdText) tile.holdText.destroy();
      tile.destroy();
    });
    this.tiles = [];
    
    // Level complete message
    const { width, height } = this.cameras.main;
    const levelCompleteText = this.add.text(width / 2, height / 2 - 100, 'LEVEL COMPLETE!', {
      fontSize: '48px',
      fill: '#00ff00',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 4
    });
    levelCompleteText.setOrigin(0.5);
    levelCompleteText.setDepth(1001);
    
    // Animate level complete text
    this.tweens.add({
      targets: levelCompleteText,
      scale: { from: 0, to: 1.2 },
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(1000, () => {
          levelCompleteText.destroy();
          this.startNextLevel();
        });
      }
    });
  }

  startNextLevel() {
    this.currentLevel++;
    
    // Update speed for new level
    this.gameSpeed = this.baseSpeed * Math.pow(this.speedMultiplier, this.currentLevel - 1);
    
    // Update UI
    this.levelText.setText(`LEVEL ${this.currentLevel}`);
    this.updateProgressBar(0);
    
    // Countdown
    const { width, height } = this.cameras.main;
    const countdownValues = ['3', '2', '1', 'GO!'];
    let countdownIndex = 0;
    
    const showCountdown = () => {
      if (countdownIndex < countdownValues.length) {
        const countdownText = this.add.text(width / 2, height / 2, countdownValues[countdownIndex], {
          fontSize: '72px',
          fill: countdownIndex === 3 ? '#00ff00' : '#ffffff',
          fontStyle: 'bold',
          stroke: '#000000',
          strokeThickness: 6
        });
        countdownText.setOrigin(0.5);
        countdownText.setDepth(1001);
        
        this.tweens.add({
          targets: countdownText,
          scale: { from: 0.5, to: 1.5 },
          alpha: { from: 1, to: 0 },
          duration: 800,
          ease: 'Cubic.easeOut',
          onComplete: () => countdownText.destroy()
        });
        
        countdownIndex++;
        if (countdownIndex < countdownValues.length) {
          this.time.delayedCall(800, showCountdown);
        } else {
          // Start the new level
          this.time.delayedCall(800, () => {
            this.isTransitioningLevel = false;
            this.levelStartTime = this.time.now;
            this.levelProgress = 0;
          });
        }
      }
    };
    
    showCountdown();
  }

  missTile(tile) {
    this.combo = 0;
    this.lives--;

    this.cameras.main.shake(200, 0.01);

    const missEffect = this.add.graphics();
    missEffect.fillStyle(GAME_CONFIG.colors.miss, 0.3);
    missEffect.fillRect(0, GAME_CONFIG.hudHeight, GAME_CONFIG.width, GAME_CONFIG.gameplayHeight);

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
    this.scoreText.setText(`${this.score}`);
    this.comboText.setText(`Streak: ${this.combo}`);
    this.livesText.setText(`${this.lives}`);
  }

  gameVictory() {
    this.isGameOver = true;
    this.isTransitioningLevel = true;
    
    // Clean up all tiles
    this.tiles.forEach(tile => {
      if (tile.hitArea) tile.hitArea.destroy();
      if (tile.holdText) tile.holdText.destroy();
      tile.destroy();
    });
    this.tiles = [];
    
    // Victory message
    const { width, height } = this.cameras.main;
    const victoryText = this.add.text(width / 2, height / 2 - 100, 'VICTORY!', {
      fontSize: '64px',
      fill: '#ffd700',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 6
    });
    victoryText.setOrigin(0.5);
    
    const scoreText = this.add.text(width / 2, height / 2, `Final Score: ${this.score}`, {
      fontSize: '36px',
      fill: '#ffffff'
    });
    scoreText.setOrigin(0.5);
    
    const messageText = this.add.text(width / 2, height / 2 + 60, 'All 5 Levels Complete!', {
      fontSize: '28px',
      fill: '#00ff00'
    });
    messageText.setOrigin(0.5);
    
    // Fireworks effect
    for (let i = 0; i < 20; i++) {
      this.time.delayedCall(i * 100, () => {
        const x = Phaser.Math.Between(50, width - 50);
        const y = Phaser.Math.Between(100, height - 100);
        this.createFirework(x, y);
      });
    }
    
    // Go to game over scene after celebration
    this.time.delayedCall(5000, () => {
      this.scene.start('GameOverScene', { score: this.score, victory: true });
    });
  }

  createFirework(x, y) {
    for (let i = 0; i < 16; i++) {
      const particle = this.add.graphics();
      particle.fillStyle(Phaser.Display.Color.HSLToColor(Math.random(), 1, 0.5).color, 1);
      particle.fillCircle(0, 0, 4);
      particle.x = x;
      particle.y = y;
      
      const angle = (i / 16) * Math.PI * 2;
      const speed = Phaser.Math.Between(50, 150);
      
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 1000,
        onComplete: () => particle.destroy()
      });
    }
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
