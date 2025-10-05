import Phaser from 'phaser';
import { GAME_CONFIG } from '../config';
import { TEXT_STYLES } from '../styles';

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    // Get difficulty from data (default to easy if not provided)
    this.difficulty = data?.difficulty || 'easy';
    
    // Get code effects from data
    this.codeEffects = {
      lives: data?.lives || 3,
      speedMultiplier: data?.speedMultiplier || 1.0,
      startingPoints: data?.startingPoints || 0,
      pointMultiplier: data?.pointMultiplier || 1
    };
    
    // Reset all game state when scene starts/restarts
    this.score = this.codeEffects.startingPoints; // Use starting points from codes
    this.lastScore = this.score; // Track for pulse animation
    this.combo = 0;
    this.lives = this.codeEffects.lives; // Use code-modified lives
    this.tiles = [];
    this.tilePool = [];
    this.isGameOver = false;
    this.spawnTimer = 0;
    this.holdingTiles = new Map();
    this.scorePulseTween = null; // Track active pulse tween
    
    // Level system - ensure everything is reset
    this.currentLevel = 1; // Always start at level 1
    this.maxLevel = 10; // Increased from 5 to 10 levels
    this.levelDuration = 20000; // 20 seconds per level
    this.levelStartTime = null; // Set to null, will be initialized in create()
    this.levelProgress = 0;
    this.isTransitioningLevel = false;
    this.speedMultiplier = 1.12; // Reduced from 1.25 to 1.12 for smoother progression over 10 levels
    this.lastLuckyTileTime = 0; // Track when last lucky tile was spawned
    
    // Set base speed based on difficulty (this affects ALL levels)
    switch(this.difficulty) {
      case 'hard':
        // Start with higher base speed, will get even faster with each level
        this.baseSpeed = GAME_CONFIG.tileSpeed * Math.pow(this.speedMultiplier, 5); // Adjusted for 10 levels
        break;
      case 'medium':
        // Start with moderate base speed
        this.baseSpeed = GAME_CONFIG.tileSpeed * Math.pow(this.speedMultiplier, 3); // Adjusted for 10 levels
        break;
      case 'easy':
      default:
        // Normal base speed
        this.baseSpeed = GAME_CONFIG.tileSpeed;
        break;
    }
    
    // Set initial game speed (will increase with each level) - apply code effect
    this.gameSpeed = this.baseSpeed * this.codeEffects.speedMultiplier;
  }
  
  cleanupUI() {
    // Destroy existing UI elements if they exist
    if (this.levelText) {
      this.levelText.destroy();
      this.levelText = null;
    }
    if (this.progressBarFill) {
      this.progressBarFill.clear();
      this.progressBarFill.destroy();
      this.progressBarFill = null;
    }
    if (this.progressBarBg) {
      this.progressBarBg.clear();
      this.progressBarBg.destroy();
      this.progressBarBg = null;
    }
    if (this.comboText) {
      this.comboText.destroy();
      this.comboText = null;
    }
    if (this.scoreText) {
      this.scoreText.destroy();
      this.scoreText = null;
    }
    if (this.scoreLabel) {
      this.scoreLabel.destroy();
      this.scoreLabel = null;
    }
    if (this.livesText) {
      this.livesText.destroy();
      this.livesText = null;
    }
    if (this.livesLabel) {
      this.livesLabel.destroy();
      this.livesLabel = null;
    }
    
    // Clear all remaining graphics and text objects
    this.children.list.forEach(child => {
      if (child && (child.type === 'Graphics' || child.type === 'Text')) {
        child.destroy();
      }
    });
  }

  create() {
    // Fade in effect
    this.cameras.main.fadeIn(300, 0, 0, 0);
    
    // Clean up any existing UI elements first
    this.cleanupUI();
    
    // Reset progress but keep difficulty-based values
    this.levelProgress = 0;
    this.levelStartTime = null;
    this.isTransitioningLevel = false;
    this.lastLuckyTileTime = 0;  // Reset lucky tile cooldown
    // Note: currentLevel and gameSpeed are set based on difficulty in init()
    
    this.createHUD();
    this.setupLanes();
    this.setupInput();
    this.setupUI();
    this.setupLevelUI();
    
    // Ensure progress bar starts completely empty
    this.levelProgress = 0;
    if (this.progressBarFill) {
      this.progressBarFill.clear();
    }
    
    // Set level start time AFTER everything is set up
    this.time.delayedCall(100, () => {
      this.levelStartTime = this.time.now;
    });
    
    // Start spawning tiles
    this.time.addEvent({
      delay: GAME_CONFIG.spawnInterval,
      callback: this.spawnTile,
      callbackScope: this,
      loop: true
    });
  }

  createHUD() {
    // Create HUD background with gradient
    const hudBg = this.add.graphics();
    hudBg.fillGradientStyle(0x151937, 0x151937, 0x0a0e27, 0x0a0e27, 0.95);
    hudBg.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.hudHeight);
    
    // Add glowing separator line
    hudBg.lineStyle(2, 0x00ccff, 0.3);
    hudBg.lineBetween(0, GAME_CONFIG.hudHeight, GAME_CONFIG.width, GAME_CONFIG.hudHeight);
    
    // Add subtle shadow
    const shadow = this.add.graphics();
    shadow.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.3);
    shadow.fillRect(0, GAME_CONFIG.hudHeight, GAME_CONFIG.width, 10);
    shadow.setDepth(99);
    
    // Set high depth so HUD renders above tiles
    hudBg.setDepth(100);
  }

  setupLanes() {
    const laneWidth = GAME_CONFIG.width / GAME_CONFIG.lanes;
    const gameplayStart = GAME_CONFIG.hudHeight;
    const gameplayEnd = GAME_CONFIG.height;

    // Draw lane dividers with subtle gradient
    for (let i = 0; i < GAME_CONFIG.lanes; i++) {
      const x = i * laneWidth + laneWidth / 2;
      const lane = this.add.graphics();
      lane.lineStyle(2, 0x151937, 0.3);
      lane.lineBetween(i * laneWidth, gameplayStart, i * laneWidth, gameplayEnd);
    }

    // Modern hit zone with gradient
    const hitZone = this.add.graphics();
    hitZone.fillGradientStyle(0xff3366, 0xff3366, 0xff0033, 0xff0033, 0.15);
    hitZone.fillRect(0, gameplayEnd - 120, GAME_CONFIG.width, 120);
    
    // Add glowing border line at hit zone boundary
    const hitLine = this.add.graphics();
    hitLine.lineStyle(3, 0xff3366, 0.6);
    hitLine.lineBetween(0, gameplayEnd - 120, GAME_CONFIG.width, gameplayEnd - 120);
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
    this.scoreLabel = this.add.text(80, 30, 'SCORE', TEXT_STYLES.hudLabel);
    this.scoreLabel.setOrigin(0.5, 0);
    this.scoreLabel.setDepth(101);
    this.scoreLabel.setShadow(0, 2, '#000000', 4, true, true);
    
    // Initialize score text with formatted value
    const initialScore = this.formatScore(this.score);
    this.scoreText = this.add.text(80, 65, initialScore, TEXT_STYLES.hudValue);
    this.scoreText.setOrigin(0.5, 0);
    this.scoreText.setDepth(101);
    this.scoreText.setShadow(0, 3, '#000000', 8, true, true);
    
    // Apply initial font size if score is large
    if (initialScore.length > 7) {
      this.scoreText.setFontSize('32px');
    } else if (initialScore.length > 5) {
      this.scoreText.setFontSize('36px');
    }

    // Lives on right - label and value stacked
    const { width } = this.cameras.main;
    this.livesLabel = this.add.text(width - 80, 30, 'LIVES', TEXT_STYLES.hudLabel);
    this.livesLabel.setOrigin(0.5, 0);
    this.livesLabel.setDepth(101);
    this.livesLabel.setShadow(0, 2, '#000000', 4, true, true);
    
    this.livesText = this.add.text(width - 80, 65, `${this.lives}`, {
      ...TEXT_STYLES.hudValue,
      fill: '#ff6b9d'
    });
    this.livesText.setOrigin(0.5, 0);
    this.livesText.setDepth(101);
    this.livesText.setShadow(0, 3, '#ff0066', 10, true, true);
    
    // Show code indicators under respective HUD elements
    
    // MEGA LIVES indicator under LIVES count
    if (this.codeEffects.lives > 3) {
      const megaLivesIndicator = this.add.text(width - 80, 100, 'MEGA LIVES', {
        fontFamily: 'Poppins',
        fontSize: '12px',
        fontStyle: '600',
        fill: '#ff6b9d',
        stroke: '#000000',
        strokeThickness: 2
      });
      megaLivesIndicator.setOrigin(0.5, 0);
      megaLivesIndicator.setDepth(101);
      megaLivesIndicator.setShadow(0, 2, '#ff0066', 5, true, true);
    }
    
    // Point-related indicators under SCORE count
    const hasPointBoosts = this.codeEffects.startingPoints > 0 || this.codeEffects.pointMultiplier > 1;
    if (hasPointBoosts) {
      let indicatorText = '';
      
      // Build the indicator text based on active codes
      if (this.codeEffects.pointMultiplier > 1) {
        indicatorText = `${this.codeEffects.pointMultiplier}X POINTS`;
      }
      
      if (this.codeEffects.startingPoints > 0) {
        if (indicatorText) {
          indicatorText += ' • BILLION PTS';
        } else {
          indicatorText = 'BILLION PTS';
        }
      }
      
      const pointIndicator = this.add.text(80, 100, indicatorText, {
        fontFamily: 'Poppins',
        fontSize: '12px',
        fontStyle: '600',
        fill: '#ffd700',
        stroke: '#000000',
        strokeThickness: 2
      });
      pointIndicator.setOrigin(0.5, 0);
      pointIndicator.setDepth(101);
      pointIndicator.setShadow(0, 2, '#ff6600', 5, true, true);
    }
    
    // SLOW MOTION indicator at bottom center of HUD
    if (this.codeEffects.speedMultiplier < 1) {
      const slowMoIndicator = this.add.text(width / 2, 115, 'SLOW MOTION', {
        fontFamily: 'Poppins',
        fontSize: '12px',
        fontStyle: '600',
        fill: '#00ccff',
        stroke: '#000000',
        strokeThickness: 2
      });
      slowMoIndicator.setOrigin(0.5, 0);
      slowMoIndicator.setDepth(101);
      slowMoIndicator.setShadow(0, 2, '#0066ff', 5, true, true);
    }
  }

  setupLevelUI() {
    const { width } = this.cameras.main;
    
    // Level indicator in HUD - scaled for tablet - always start at LEVEL 1
    this.levelText = this.add.text(width / 2, 15, 'LEVEL 1', TEXT_STYLES.levelText);
    this.levelText.setOrigin(0.5, 0);
    this.levelText.setDepth(101);
    this.levelText.setShadow(0, 3, '#000066', 10, true, true);
    
    // Progress bar in HUD - wider for tablet with glow
    const progressBarWidth = 280;
    const progressBarHeight = 18;
    const progressBarX = width / 2 - progressBarWidth / 2;
    const progressBarY = 50;
    
    this.progressBarBg = this.add.graphics();
    this.progressBarBg.fillStyle(0x151937, 0.9);
    this.progressBarBg.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
    this.progressBarBg.lineStyle(2, 0x00ccff, 0.3);
    this.progressBarBg.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
    this.progressBarBg.setDepth(101);
    
    // Progress bar fill
    this.progressBarFill = this.add.graphics();
    this.progressBarFill.setDepth(101);
    
    // Progress segments (25% marks)
    for (let i = 1; i < 4; i++) {
      const segmentX = progressBarX + (progressBarWidth * i / 4);
      const segment = this.add.graphics();
      segment.lineStyle(1, 0x0a0e27, 0.5);
      segment.lineBetween(segmentX, progressBarY + 2, segmentX, progressBarY + progressBarHeight - 2);
      segment.setDepth(102);
    }

    // Streak below progress bar
    this.comboText = this.add.text(width / 2, 85, 'Streak: 0', TEXT_STYLES.streakText);
    this.comboText.setOrigin(0.5, 0);
    this.comboText.setDepth(101);
    this.comboText.setShadow(0, 2, '#ff6600', 15, true, true);
    
    // Force clear the progress bar
    this.levelProgress = 0;
    if (this.progressBarFill) {
      this.progressBarFill.clear();
    }
  }

  updateProgressBar(progress) {
    // Safety check - only update if progress bar exists
    if (!this.progressBarFill) return;
    
    const { width } = this.cameras.main;
    const progressBarWidth = 280;
    const progressBarHeight = 18;
    const progressBarX = width / 2 - progressBarWidth / 2;
    const progressBarY = 50;
    
    // Always clear the progress bar first
    this.progressBarFill.clear();
    
    // Clamp progress between 0 and 1 and only draw if there's actual progress
    const clampedProgress = Math.max(0, Math.min(1, progress));
    if (clampedProgress > 0 && clampedProgress <= 1) {
      // Gradient fill for progress
      this.progressBarFill.fillGradientStyle(0x00ff88, 0x00ff88, 0x00ccff, 0x00ccff, 1);
      const fillWidth = progressBarWidth * clampedProgress;
      this.progressBarFill.fillRect(progressBarX, progressBarY, fillWidth, progressBarHeight);
    }
  }

  spawnTile() {
    if (this.isGameOver || this.isTransitioningLevel) return;

    const lane = Phaser.Math.Between(0, GAME_CONFIG.lanes - 1);
    const randomValue = Math.random();
    
    // 5% chance for lucky tile (with cooldown), 20% for long tile, 75% for normal
    let tileType = 'normal';
    
    // Check if enough time has passed since last lucky tile (5 second cooldown)
    const currentTime = this.time.now;
    const timeSinceLastLucky = this.lastLuckyTileTime ? (currentTime - this.lastLuckyTileTime) : Infinity;
    const canSpawnLucky = timeSinceLastLucky > 5000;
    
    if (randomValue < 0.05 && canSpawnLucky) {
      tileType = 'lucky';
      this.lastLuckyTileTime = currentTime;
    } else if (randomValue < 0.25) {  // 0.05 + 0.20 = 0.25
      tileType = 'long';
    }
    
    const tile = this.createTile(lane, tileType);
    this.tiles.push(tile);
  }

  createTile(lane, tileType = 'normal') {
    const isLongTile = tileType === 'long';
    const isLuckyTile = tileType === 'lucky';
    
    const laneWidth = GAME_CONFIG.width / GAME_CONFIG.lanes;
    const x = lane * laneWidth + laneWidth / 2;
    const y = GAME_CONFIG.hudHeight - GAME_CONFIG.tileHeight;  // Start tiles just above HUD

    const tileHeight = isLongTile ? GAME_CONFIG.tileHeight * 2 : GAME_CONFIG.tileHeight;
    const color = isLongTile ? GAME_CONFIG.colors.blue : GAME_CONFIG.colors.green;

    // Create an invisible interactive rectangle for the tile
    const hitArea = this.add.rectangle(x, y + tileHeight/2, GAME_CONFIG.tileWidth, tileHeight);
    hitArea.setInteractive();
    hitArea.setAlpha(0.01); // Almost invisible but still interactive

    const tile = this.add.graphics();
    // Add gradient effect to tiles based on type
    if (isLuckyTile) {
      // Golden gradient for lucky tiles
      tile.fillGradientStyle(GAME_CONFIG.colors.lucky, GAME_CONFIG.colors.luckyGlow, GAME_CONFIG.colors.lucky, GAME_CONFIG.colors.luckyGlow, 0.95);
      tile.fillRect(-GAME_CONFIG.tileWidth/2, 0, GAME_CONFIG.tileWidth, tileHeight);
      
      // Pulsing glow border
      tile.lineStyle(4, GAME_CONFIG.colors.luckyGlow, 1);
      tile.strokeRect(-GAME_CONFIG.tileWidth/2, 0, GAME_CONFIG.tileWidth, tileHeight);
      
      // Inner glow
      tile.lineStyle(2, 0xffffff, 0.5);
      tile.strokeRect(-GAME_CONFIG.tileWidth/2 + 4, 4, GAME_CONFIG.tileWidth - 8, tileHeight - 8);
      
      // Add sparkle text  
      const sparkleText = this.add.text(0, tileHeight/2, '⭐ LUCKY ⭐', {
        fontFamily: 'Poppins',
        fontSize: '18px',
        fontStyle: '700',
        fill: '#ffffff',
        stroke: '#ff6600',
        strokeThickness: 2
      });
      sparkleText.setOrigin(0.5);
      tile.sparkleText = sparkleText;
    } else if (isLongTile) {
      tile.fillGradientStyle(GAME_CONFIG.colors.blue, GAME_CONFIG.colors.blue, 0x0099cc, 0x0099cc, 0.95);
      tile.fillRect(-GAME_CONFIG.tileWidth/2, 0, GAME_CONFIG.tileWidth, tileHeight);
      tile.lineStyle(2, 0x00ffff, 0.5);
      tile.strokeRect(-GAME_CONFIG.tileWidth/2, 0, GAME_CONFIG.tileWidth, tileHeight);
    } else {
      tile.fillGradientStyle(GAME_CONFIG.colors.green, GAME_CONFIG.colors.green, 0x00cc66, 0x00cc66, 0.95);
      tile.fillRect(-GAME_CONFIG.tileWidth/2, 0, GAME_CONFIG.tileWidth, tileHeight);
      tile.lineStyle(2, 0x00ffaa, 0.5);
      tile.strokeRect(-GAME_CONFIG.tileWidth/2, 0, GAME_CONFIG.tileWidth, tileHeight);
    }

    if (isLongTile) {
      const holdText = this.add.text(0, tileHeight/2, '⬆ HOLD ⬆', TEXT_STYLES.holdText);
      holdText.setOrigin(0.5);
      tile.holdText = holdText;
    }

    tile.x = x;
    tile.y = y;
    tile.lane = lane;
    tile.isLongTile = isLongTile;
    tile.isLuckyTile = isLuckyTile;
    tile.tileHeight = tileHeight;
    tile.isHit = false;
    tile.holdProgress = 0;
    tile.hitArea = hitArea;
    tile.isHolding = false;
    tile.pulseTime = 0;  // For animating lucky tiles

    // Add event listeners to the hit area
    hitArea.on('pointerdown', () => {
      if (!tile.isHit) {
        if (tile.isLuckyTile) {
          this.hitLuckyTile(tile);
        } else if (tile.isLongTile) {
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
        this.score += Math.floor(20 * progress * this.codeEffects.pointMultiplier);

        if (progress >= 0.8) {
          // Store previous combo to check for milestone crossing
          const previousCombo = this.combo;
          this.combo++;
          
          // Check if we crossed any milestone
          const previousMilestone = Math.floor(previousCombo / 10);
          const currentMilestone = Math.floor(this.combo / 10);
          
          if (currentMilestone > previousMilestone) {
            this.celebrateStreakMilestone(currentMilestone * 10);
          }
          
          // Now hit the tile (without incrementing combo again)
          tile.isHit = true;
          this.createModernHitEffect(tile, 20);
          this.animateTileDestruction(tile);
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
        this.score += Math.floor(20 * progress * this.codeEffects.pointMultiplier);

        if (progress >= 0.8) {
          // Store previous combo to check for milestone crossing
          const previousCombo = this.combo;
          this.combo++;
          
          // Check if we crossed any milestone
          const previousMilestone = Math.floor(previousCombo / 10);
          const currentMilestone = Math.floor(this.combo / 10);
          
          if (currentMilestone > previousMilestone) {
            this.celebrateStreakMilestone(currentMilestone * 10);
          }
          
          // Now hit the tile (without incrementing combo again)
          tile.isHit = true;
          this.createModernHitEffect(tile, 20);
          this.animateTileDestruction(tile);
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
      this.score += Math.floor(20 * progress * this.codeEffects.pointMultiplier);

      if (progress >= 0.8) {
        // Store previous combo to check for milestone crossing
        const previousCombo = this.combo;
        this.combo++;
        
        // Check if we crossed any milestone
        const previousMilestone = Math.floor(previousCombo / 10);
        const currentMilestone = Math.floor(this.combo / 10);
        
        if (currentMilestone > previousMilestone) {
          this.celebrateStreakMilestone(currentMilestone * 10);
        }
        
        // Now hit the tile
        holdingTile.isHit = true;
        this.createModernHitEffect(holdingTile, 20);
        this.animateTileDestruction(holdingTile);
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
    const basePoints = 10 * Math.max(1, Math.floor(this.combo / 5));
    const points = basePoints * this.codeEffects.pointMultiplier;
    this.score += points;
    
    // Store previous combo to check for milestone crossing
    const previousCombo = this.combo;
    this.combo++;

    // Check if we crossed any milestone (every 10)
    const previousMilestone = Math.floor(previousCombo / 10);
    const currentMilestone = Math.floor(this.combo / 10);
    
    if (currentMilestone > previousMilestone) {
      // We crossed a milestone, celebrate the milestone we crossed
      this.celebrateStreakMilestone(currentMilestone * 10);
    }

    // Create modern hit effects
    this.createModernHitEffect(tile, points);

    // Animate tile destruction
    this.animateTileDestruction(tile);

    this.updateUI();
  }

  createModernHitEffect(tile, points) {
    const x = tile.x;
    const y = tile.y + tile.tileHeight/2;
    const isLongTile = tile.isLongTile;
    
    // 1. Score popup animation
    const scoreText = this.add.text(x, y, `+${points}`, {
      fontFamily: 'Poppins',
      fontSize: '32px',
      fontStyle: '700',
      fill: isLongTile ? '#00ccff' : '#00ff88',
      stroke: '#151937',
      strokeThickness: 3
    });
    scoreText.setOrigin(0.5);
    scoreText.setDepth(500);
    
    this.tweens.add({
      targets: scoreText,
      y: y - 80,
      alpha: { from: 1, to: 0 },
      scale: { from: 0.5, to: 1.2 },
      duration: 800,
      ease: 'Power2',
      onComplete: () => scoreText.destroy()
    });
    
    // 2. Ring pulse effect
    const ring = this.add.graphics();
    ring.lineStyle(3, isLongTile ? 0x00ccff : 0x00ff88, 1);
    ring.strokeRect(x - GAME_CONFIG.tileWidth/2, y - tile.tileHeight/2, GAME_CONFIG.tileWidth, tile.tileHeight);
    ring.setDepth(400);
    
    this.tweens.add({
      targets: ring,
      scaleX: 1.2,
      scaleY: 1.3,
      alpha: 0,
      duration: 400,
      ease: 'Power2',
      onComplete: () => ring.destroy()
    });
    
    // 3. Particle burst
    for (let i = 0; i < 8; i++) {
      const particle = this.add.graphics();
      const color = isLongTile ? 
        (i % 2 ? 0x00ccff : 0x00ffff) : 
        (i % 2 ? 0x00ff88 : 0x00ffaa);
      
      particle.fillStyle(color, 1);
      particle.fillRect(-3, -3, 6, 6);
      particle.x = x;
      particle.y = y;
      particle.setDepth(450);
      
      const angle = (i / 8) * Math.PI * 2;
      const distance = Phaser.Math.Between(50, 100);
      
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: { from: 1, to: 0 },
        duration: 600,
        ease: 'Power2',
        onComplete: () => particle.destroy()
      });
    }
    
    // 4. Flash effect
    const flash = this.add.graphics();
    flash.fillStyle(0xffffff, 0.3);
    flash.fillRect(x - GAME_CONFIG.tileWidth/2, y - tile.tileHeight/2, GAME_CONFIG.tileWidth, tile.tileHeight);
    flash.setDepth(350);
    
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 200,
      onComplete: () => flash.destroy()
    });
  }

  animateTileDestruction(tile) {
    // Fade and scale down tile
    this.tweens.add({
      targets: tile,
      alpha: 0,
      scaleY: 0,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        tile.destroy();
        if (tile.holdText) tile.holdText.destroy();
        if (tile.sparkleText) tile.sparkleText.destroy();
        if (tile.hitArea) tile.hitArea.destroy();
      }
    });
    
    // Also fade the hold text if it exists
    if (tile.holdText) {
      this.tweens.add({
        targets: tile.holdText,
        alpha: 0,
        scale: 0.8,
        duration: 200
      });
    }
    
    // Also fade the sparkle text for lucky tiles
    if (tile.sparkleText) {
      this.tweens.add({
        targets: tile.sparkleText,
        alpha: 0,
        scale: 0.5,
        duration: 200
      });
    }
  }

  hitLuckyTile(tile) {
    if (tile.isHit) return;
    
    tile.isHit = true;
    
    // Random outcome: 40% big points, 30% lose life, 30% gain life
    const randomOutcome = Math.random();
    
    let resultMessage = '';
    let resultColor = '#ffffff';
    let resultValue = 0;
    
    if (randomOutcome < 0.4) {
      // Big points bonus!
      resultValue = Phaser.Math.Between(50, 150) * this.codeEffects.pointMultiplier;
      this.score += resultValue;
      resultMessage = `+${resultValue} POINTS!`;
      resultColor = '#ffd700';
    } else if (randomOutcome < 0.7) {
      // Lose a life
      if (this.lives > 1) {
        this.lives--;
        resultMessage = '−1 LIFE!';
        resultColor = '#ff3366';
      } else {
        // If only 1 life left, give points instead
        resultValue = 30 * this.codeEffects.pointMultiplier;
        this.score += resultValue;
        resultMessage = `+${resultValue} POINTS!`;
        resultColor = '#ffd700';
      }
    } else {
      // Gain a life!
      if (this.lives < 5) {
        this.lives++;
        resultMessage = '+1 LIFE!';
        resultColor = '#00ff88';
      } else {
        // Max lives, give points instead
        resultValue = 100 * this.codeEffects.pointMultiplier;
        this.score += resultValue;
        resultMessage = `+${resultValue} POINTS!`;
        resultColor = '#ffd700';
      }
    }
    
    // Display result message higher on screen
    this.displayLuckyResult(tile.x, tile.y - 100, resultMessage, resultColor);
    
    // Create special effect for lucky tile hit
    this.createLuckyHitEffect(tile);
    
    // Animate tile destruction
    this.animateTileDestruction(tile);
    
    // Check if lost all lives
    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.updateUI();
    }
  }
  
  displayLuckyResult(x, y, message, color) {
    const { width, height } = this.cameras.main;
    
    // Position higher on screen (around 1/3 from top)
    const displayY = Math.min(y, height * 0.3);
    
    // Create the result text with dramatic styling
    const resultText = this.add.text(x, displayY, message, {
      fontFamily: 'Poppins',
      fontSize: '56px',
      fontStyle: '900',
      fill: color,
      stroke: '#151937',
      strokeThickness: 6
    });
    resultText.setOrigin(0.5);
    resultText.setDepth(1100);
    resultText.setShadow(0, 5, '#000000', 20, true, true);
    
    // Add secondary glow effect
    const glowText = this.add.text(x, displayY, message, {
      fontFamily: 'Poppins',
      fontSize: '56px',
      fontStyle: '900',
      fill: color,
      alpha: 0.5
    });
    glowText.setOrigin(0.5);
    glowText.setDepth(1099);
    glowText.setScale(1.1);
    
    // Animate the result
    this.tweens.add({
      targets: [resultText, glowText],
      scale: { from: 0, to: 1.2 },
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: [resultText, glowText],
          y: displayY - 60,
          alpha: 0,
          duration: 1200,
          delay: 500,
          ease: 'Power2',
          onComplete: () => {
            resultText.destroy();
            glowText.destroy();
          }
        });
      }
    });
    
    // Screen flash effect based on result
    const flashColor = color === '#ff3366' ? 0xff0000 : (color === '#00ccff' ? 0x00ccff : 0xffd700);
    const flash = this.add.rectangle(width / 2, height / 2, width, height, flashColor);
    flash.setAlpha(0.3);
    flash.setDepth(998);
    
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });
  }
  
  createLuckyHitEffect(tile) {
    const x = tile.x;
    const y = tile.y + tile.tileHeight/2;
    
    // Golden starburst effect
    for (let i = 0; i < 16; i++) {
      const star = this.add.graphics();
      star.fillStyle(i % 2 ? GAME_CONFIG.colors.lucky : GAME_CONFIG.colors.luckyGlow, 1);
      
      // Draw diamond shape instead of star
      star.beginPath();
      star.moveTo(0, -8);
      star.lineTo(5, 0);
      star.lineTo(0, 8);
      star.lineTo(-5, 0);
      star.closePath();
      star.fill();
      star.x = x;
      star.y = y;
      star.setDepth(500);
      
      const angle = (i / 16) * Math.PI * 2;
      const distance = Phaser.Math.Between(100, 200);
      
      this.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: { from: 1, to: 0 },
        rotation: Math.PI * 2,
        duration: 800,
        ease: 'Power2',
        onComplete: () => star.destroy()
      });
    }
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
    const celebrationText = this.add.text(width / 2, height / 2 - 100, `${streak} STREAK!`, TEXT_STYLES.celebrationTitle);
    celebrationText.setOrigin(0.5);
    celebrationText.setDepth(1000);
    celebrationText.setShadow(0, 5, '#ff0066', 20, true, true);
    
    // Create encouraging message
    const encourageText = this.add.text(width / 2, height / 2 - 40, message, TEXT_STYLES.celebrationSubtitle);
    encourageText.setOrigin(0.5);
    encourageText.setDepth(1000);
    encourageText.setShadow(0, 3, '#000000', 10, true, true);
    
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

    // Update level progress only if levelStartTime has been set
    if (!this.isTransitioningLevel && this.levelStartTime !== null) {
      const elapsed = this.time.now - this.levelStartTime;
      this.levelProgress = Math.min(elapsed / this.levelDuration, 1);
      this.updateProgressBar(this.levelProgress);
      
      // Check for level completion
      if (this.levelProgress >= 1) {
        if (this.currentLevel < this.maxLevel) {
          this.startLevelTransition();
        } else if (this.currentLevel === this.maxLevel) {
          // Victory after completing all 10 levels!
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
      
      // Update sparkle text position and animation for lucky tiles
      if (tile.sparkleText && !tile.isHit) {
        tile.sparkleText.x = tile.x;
        tile.sparkleText.y = tile.y + tile.tileHeight/2;
        
        // Animate pulsing
        tile.pulseTime += this.game.loop.delta / 1000;
        const pulseScale = 1 + Math.sin(tile.pulseTime * 5) * 0.1;
        tile.sparkleText.setScale(pulseScale);
      }

      // Handle hold progress for tiles being held (either directly or through lane system)
      if ((tile.isHolding) || (this.holdingTiles.has(tile.lane) && this.holdingTiles.get(tile.lane) === tile)) {
        tile.holdProgress = Math.min(tile.holdProgress + this.gameSpeed * this.game.loop.delta / 1000, tile.tileHeight);

        const progressHeight = tile.holdProgress;
        tile.clear();
        // Base tile with gradient
        tile.fillGradientStyle(0x006699, 0x006699, 0x004466, 0x004466, 0.5);
        tile.fillRect(-GAME_CONFIG.tileWidth/2, 0, GAME_CONFIG.tileWidth, tile.tileHeight);
        // Progress fill with glow
        tile.fillGradientStyle(0x00ffff, 0x00ffff, 0x00ccff, 0x00ccff, 1);
        tile.fillRect(-GAME_CONFIG.tileWidth/2, tile.tileHeight - progressHeight, GAME_CONFIG.tileWidth, progressHeight);
        // Glowing border
        tile.lineStyle(2, 0x00ffff, 0.8);
        tile.strokeRect(-GAME_CONFIG.tileWidth/2, 0, GAME_CONFIG.tileWidth, tile.tileHeight);
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
      if (tile.sparkleText) tile.sparkleText.destroy();
      tile.destroy();
    });
    this.tiles = [];
    
    // Level complete message
    const { width, height } = this.cameras.main;
    const levelCompleteText = this.add.text(width / 2, height / 2 - 100, 'LEVEL COMPLETE!', {
      ...TEXT_STYLES.celebrationTitle,
      fill: '#00ff88'
    });
    levelCompleteText.setOrigin(0.5);
    levelCompleteText.setDepth(1001);
    levelCompleteText.setShadow(0, 5, '#00ff00', 25, true, true);
    
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
    
    // Update speed for new level - apply code effect
    this.gameSpeed = this.baseSpeed * Math.pow(this.speedMultiplier, this.currentLevel - 1) * this.codeEffects.speedMultiplier;
    
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
          ...TEXT_STYLES.title,
          fill: countdownIndex === 3 ? '#00ff88' : '#ffffff'
        });
        countdownText.setOrigin(0.5);
        countdownText.setDepth(1001);
        countdownText.setShadow(0, 8, countdownIndex === 3 ? '#00ff00' : '#000000', 20, true, true);
        
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
    // Lucky tiles don't take away lives when missed
    if (!tile.isLuckyTile) {
      this.combo = 0;
      this.lives--;

      this.cameras.main.shake(200, 0.01);

      const missEffect = this.add.graphics();
      missEffect.fillGradientStyle(GAME_CONFIG.colors.miss, GAME_CONFIG.colors.miss, 0xff0033, 0xff0033, 0.4);
      missEffect.fillRect(0, GAME_CONFIG.hudHeight, GAME_CONFIG.width, GAME_CONFIG.gameplayHeight);

      this.tweens.add({
        targets: missEffect,
        alpha: 0,
        duration: 300,
        onComplete: () => missEffect.destroy()
      });
    } else {
      // For lucky tiles, just reset combo without penalty
      this.combo = 0;
    }

    tile.destroy();
    if (tile.holdText) tile.holdText.destroy();
    if (tile.sparkleText) tile.sparkleText.destroy();
    if (tile.hitArea) tile.hitArea.destroy();

    this.updateUI();

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  formatScore(score) {
    // Format large numbers with K, M, B suffixes
    if (score >= 1000000000) {
      // Billions
      const billions = (score / 1000000000).toFixed(score >= 10000000000 ? 0 : 1);
      return `${billions}B`;
    } else if (score >= 1000000) {
      // Millions
      const millions = (score / 1000000).toFixed(score >= 10000000 ? 0 : 1);
      return `${millions}M`;
    } else if (score >= 10000) {
      // Thousands
      const thousands = (score / 1000).toFixed(score >= 100000 ? 0 : 1);
      return `${thousands}K`;
    }
    return score.toString();
  }
  
  pulseScore(pointsEarned = 0) {
    // Create a quick pulse animation for score feedback
    if (this.scorePulseTween) {
      this.scorePulseTween.stop();
    }
    
    // Reset scale first
    this.scoreText.setScale(1);
    
    // Create pulse animation
    this.scorePulseTween = this.tweens.add({
      targets: this.scoreText,
      scale: 1.15,
      duration: 100,
      yoyo: true,
      ease: 'Power2',
      onComplete: () => {
        this.scoreText.setScale(1);
        this.scorePulseTween = null;
      }
    });
    
    // Add temporary glow effect - color based on combo
    const glowColor = this.combo > 10 ? '#ffd700' : '#00ff88';
    this.scoreText.setShadow(0, 3, glowColor, 20, true, true);
    
    // Reset shadow after animation
    this.time.delayedCall(200, () => {
      this.scoreText.setShadow(0, 3, '#000000', 8, true, true);
    });
    
    // Show mini point indicator if we have billion points active
    // This helps show that points are being earned even if display doesn't change
    if (this.codeEffects.startingPoints > 0 && pointsEarned > 0) {
      const miniPoints = this.add.text(80, 85, `+${pointsEarned}`, {
        fontFamily: 'Poppins',
        fontSize: '16px',
        fontStyle: '600',
        fill: '#00ff88',
        stroke: '#000000',
        strokeThickness: 2
      });
      miniPoints.setOrigin(0.5, 0);
      miniPoints.setDepth(102);
      miniPoints.setAlpha(0.8);
      
      // Float up and fade out
      this.tweens.add({
        targets: miniPoints,
        y: 75,
        alpha: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => miniPoints.destroy()
      });
    }
  }
  
  updateUI() {
    const formattedScore = this.formatScore(this.score);
    const previousText = this.scoreText.text;
    this.scoreText.setText(formattedScore);
    
    // Dynamic font sizing based on score display length
    let fontSize = '42px'; // Default size
    if (formattedScore.length > 7) {
      fontSize = '32px';
    } else if (formattedScore.length > 5) {
      fontSize = '36px';
    }
    
    // Only update font size if it changed
    if (this.scoreText.style.fontSize !== fontSize) {
      this.scoreText.setFontSize(fontSize);
    }
    
    // Pulse the score even if the displayed text hasn't changed
    // This gives feedback that points were earned
    if (this.lastScore !== this.score) {
      const pointsEarned = this.score - this.lastScore;
      this.pulseScore(pointsEarned);
      this.lastScore = this.score;
    }
    
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
      if (tile.sparkleText) tile.sparkleText.destroy();
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
    
    const scoreText = this.add.text(width / 2, height / 2, `Final Score: ${this.formatScore(this.score)}`, {
      fontSize: '36px',
      fill: '#ffffff'
    });
    scoreText.setOrigin(0.5);
    
    const messageText = this.add.text(width / 2, height / 2 + 60, 'All 10 Levels Complete!', {
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
      this.scene.start('GameOverScene', { score: this.score, victory: true, difficulty: this.difficulty });
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

    // Stop update loop immediately
    this.levelStartTime = null;
    this.levelProgress = 0;

    // Clean up all tiles
    this.tiles.forEach(tile => {
      if (tile.hitArea) tile.hitArea.destroy();
      if (tile.holdText) tile.holdText.destroy();
      if (tile.sparkleText) tile.sparkleText.destroy();
      tile.destroy();
    });

    // Clear the tiles array
    this.tiles = [];

    // Clear any timers
    this.time.removeAllEvents();

    this.scene.start('GameOverScene', { score: this.score, difficulty: this.difficulty });
  }
}

export default GameScene;
