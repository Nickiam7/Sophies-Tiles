import Phaser from 'phaser'
import { TEXT_STYLES } from '../styles'

class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
    this.selectedDifficulty = 'easy' // Default to easy
  }

  create() {
    const { width, height } = this.cameras.main
    
    // Fade in effect
    this.cameras.main.fadeIn(300, 0, 0, 0)

    const title = this.add.text(width / 2, height * 0.25, "Sophie's Tiles", TEXT_STYLES.title)
    title.setOrigin(0.5)
    title.setShadow(0, 8, '#000000', 15, true, true)

    // Create button background with gradient effect
    const buttonBg = this.add.graphics()
    const buttonWidth = 280
    const buttonHeight = 100
    const buttonX = width / 2 - buttonWidth / 2
    const buttonY = height * 0.4 - buttonHeight / 2
    
    // Draw gradient button
    buttonBg.fillGradientStyle(0x00ff88, 0x00ff88, 0x00cc66, 0x00cc66, 1)
    buttonBg.fillRect(buttonX, buttonY, buttonWidth, buttonHeight)
    
    // Create invisible hitbox for entire button area
    const playButtonHitArea = this.add.rectangle(width / 2, height * 0.4, buttonWidth, buttonHeight)
    playButtonHitArea.setInteractive({ useHandCursor: true })
    
    const playButton = this.add.text(width / 2, height * 0.4, 'PLAY', TEXT_STYLES.button)
    playButton.setOrigin(0.5)
    playButton.setShadow(0, 4, '#000000', 10, true, true)

    playButtonHitArea.on('pointerover', () => {
      this.tweens.add({
        targets: playButton,
        scale: 1.1,
        duration: 200,
        ease: 'Power2'
      })
      buttonBg.clear()
      buttonBg.fillGradientStyle(0x00ffaa, 0x00ffaa, 0x00dd77, 0x00dd77, 1)
      buttonBg.fillRect(buttonX, buttonY, buttonWidth, buttonHeight)
    })

    playButtonHitArea.on('pointerout', () => {
      this.tweens.add({
        targets: playButton,
        scale: 1,
        duration: 200,
        ease: 'Power2'
      })
      buttonBg.clear()
      buttonBg.fillGradientStyle(0x00ff88, 0x00ff88, 0x00cc66, 0x00cc66, 1)
      buttonBg.fillRect(buttonX, buttonY, buttonWidth, buttonHeight)
    })

    playButtonHitArea.on('pointerdown', () => {
      // Press animation
      this.tweens.add({
        targets: playButton,
        scale: 0.95,
        duration: 100,
        yoyo: true,
        ease: 'Power2',
        onComplete: () => {
          // Fade out before scene transition
          this.cameras.main.fadeOut(300, 0, 0, 0)
          this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('GameScene', { difficulty: this.selectedDifficulty })
          })
        }
      })
    })

    // Add difficulty selection label
    const difficultyLabel = this.add.text(width / 2, height * 0.55, 'SELECT DIFFICULTY', {
      fontFamily: 'Poppins',
      fontSize: '24px',
      fontStyle: '600',
      fill: '#ffffff',
      stroke: '#151937',
      strokeThickness: 2
    })
    difficultyLabel.setOrigin(0.5)
    difficultyLabel.setShadow(0, 2, '#000000', 5, true, true)

    // Create difficulty buttons
    this.createDifficultyButtons(width, height)

    const instructions = this.add.text(width / 2, height * 0.82,
      'Tap tiles before they reach the bottom!\nHold blue tiles for the duration!', 
      TEXT_STYLES.instruction)
    instructions.setOrigin(0.5)
    instructions.setShadow(0, 2, '#000000', 5, true, true)
  }

  createDifficultyButtons(width, height) {
    const difficulties = ['easy', 'medium', 'hard']
    const labels = ['EASY', 'MEDIUM', 'HARD']
    const colors = {
      easy: { normal: 0x00ff88, hover: 0x00ffaa, selected: 0x00cc66 },
      medium: { normal: 0xffd700, hover: 0xffdd33, selected: 0xffaa00 },
      hard: { normal: 0xff3366, hover: 0xff5588, selected: 0xcc0033 }
    }
    
    const buttonWidth = 90
    const buttonHeight = 60
    const spacing = 10
    const totalWidth = (buttonWidth * 3) + (spacing * 2)
    const startX = width / 2 - totalWidth / 2
    const buttonY = height * 0.63
    
    this.difficultyButtons = {}
    this.difficultyBackgrounds = {}
    
    difficulties.forEach((difficulty, index) => {
      const x = startX + (index * (buttonWidth + spacing)) + buttonWidth / 2
      
      // Create button background
      const buttonBg = this.add.graphics()
      this.difficultyBackgrounds[difficulty] = buttonBg
      
      // Draw initial state (selected for easy)
      const isSelected = difficulty === this.selectedDifficulty
      if (isSelected) {
        buttonBg.fillStyle(colors[difficulty].selected, 1)
        buttonBg.lineStyle(3, 0xffffff, 0.8)
      } else {
        buttonBg.fillStyle(colors[difficulty].normal, 0.7)
        buttonBg.lineStyle(2, colors[difficulty].normal, 0.3)
      }
      buttonBg.fillRect(x - buttonWidth/2, buttonY - buttonHeight/2, buttonWidth, buttonHeight)
      buttonBg.strokeRect(x - buttonWidth/2, buttonY - buttonHeight/2, buttonWidth, buttonHeight)
      
      // Create hitbox
      const hitArea = this.add.rectangle(x, buttonY, buttonWidth, buttonHeight)
      hitArea.setInteractive({ useHandCursor: true })
      
      // Create button text
      const buttonText = this.add.text(x, buttonY, labels[index], {
        fontFamily: 'Poppins',
        fontSize: '22px',
        fontStyle: '700',
        fill: '#ffffff',
        stroke: '#151937',
        strokeThickness: 2
      })
      buttonText.setOrigin(0.5)
      buttonText.setShadow(0, 2, '#000000', 5, true, true)
      this.difficultyButtons[difficulty] = buttonText
      
      // Add interactivity
      hitArea.on('pointerover', () => {
        if (this.selectedDifficulty !== difficulty) {
          this.tweens.add({
            targets: buttonText,
            scale: 1.05,
            duration: 100,
            ease: 'Power2'
          })
          buttonBg.clear()
          buttonBg.fillStyle(colors[difficulty].hover, 0.8)
          buttonBg.lineStyle(2, colors[difficulty].hover, 0.5)
          buttonBg.fillRect(x - buttonWidth/2, buttonY - buttonHeight/2, buttonWidth, buttonHeight)
          buttonBg.strokeRect(x - buttonWidth/2, buttonY - buttonHeight/2, buttonWidth, buttonHeight)
        }
      })
      
      hitArea.on('pointerout', () => {
        if (this.selectedDifficulty !== difficulty) {
          this.tweens.add({
            targets: buttonText,
            scale: 1,
            duration: 100,
            ease: 'Power2'
          })
          buttonBg.clear()
          buttonBg.fillStyle(colors[difficulty].normal, 0.7)
          buttonBg.lineStyle(2, colors[difficulty].normal, 0.3)
          buttonBg.fillRect(x - buttonWidth/2, buttonY - buttonHeight/2, buttonWidth, buttonHeight)
          buttonBg.strokeRect(x - buttonWidth/2, buttonY - buttonHeight/2, buttonWidth, buttonHeight)
        }
      })
      
      hitArea.on('pointerdown', () => {
        this.selectDifficulty(difficulty, difficulties, colors, buttonWidth, buttonHeight, startX, buttonY, spacing)
      })
    })
  }
  
  selectDifficulty(selectedDifficulty, difficulties, colors, buttonWidth, buttonHeight, startX, buttonY, spacing) {
    this.selectedDifficulty = selectedDifficulty
    
    // Update all buttons
    difficulties.forEach((difficulty, index) => {
      const x = startX + (index * (buttonWidth + spacing)) + buttonWidth / 2
      const buttonBg = this.difficultyBackgrounds[difficulty]
      const buttonText = this.difficultyButtons[difficulty]
      
      buttonBg.clear()
      if (difficulty === selectedDifficulty) {
        // Selected state
        buttonBg.fillStyle(colors[difficulty].selected, 1)
        buttonBg.lineStyle(3, 0xffffff, 0.8)
        this.tweens.add({
          targets: buttonText,
          scale: 1.1,
          duration: 200,
          ease: 'Back.easeOut'
        })
      } else {
        // Unselected state
        buttonBg.fillStyle(colors[difficulty].normal, 0.7)
        buttonBg.lineStyle(2, colors[difficulty].normal, 0.3)
        this.tweens.add({
          targets: buttonText,
          scale: 1,
          duration: 200,
          ease: 'Power2'
        })
      }
      buttonBg.fillRect(x - buttonWidth/2, buttonY - buttonHeight/2, buttonWidth, buttonHeight)
      buttonBg.strokeRect(x - buttonWidth/2, buttonY - buttonHeight/2, buttonWidth, buttonHeight)
    })
  }
}

export default MenuScene
