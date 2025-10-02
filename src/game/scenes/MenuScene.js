import Phaser from 'phaser'
import { TEXT_STYLES } from '../styles'

class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    const { width, height } = this.cameras.main
    
    // Fade in effect
    this.cameras.main.fadeIn(300, 0, 0, 0)
    
    // Add subtle border/glow around the entire scene
    const border = this.add.graphics()
    border.lineStyle(3, 0x00ccff, 0.3)
    border.strokeRect(10, 10, width - 20, height - 20)
    
    // Add inner glow
    const innerGlow = this.add.graphics()
    innerGlow.lineStyle(2, 0x9b59ff, 0.2)
    innerGlow.strokeRect(15, 15, width - 30, height - 30)

    const title = this.add.text(width / 2, height / 3, "Sophie's Tiles", TEXT_STYLES.title)
    title.setOrigin(0.5)
    title.setShadow(0, 8, '#000000', 15, true, true)

    // Create button background with gradient effect
    const buttonBg = this.add.graphics()
    const buttonWidth = 280
    const buttonHeight = 100
    const buttonX = width / 2 - buttonWidth / 2
    const buttonY = height / 2 - buttonHeight / 2
    
    // Draw gradient button
    buttonBg.fillGradientStyle(0x00ff88, 0x00ff88, 0x00cc66, 0x00cc66, 1)
    buttonBg.fillRect(buttonX, buttonY, buttonWidth, buttonHeight)
    
    // Create invisible hitbox for entire button area
    const playButtonHitArea = this.add.rectangle(width / 2, height / 2, buttonWidth, buttonHeight)
    playButtonHitArea.setInteractive({ useHandCursor: true })
    
    const playButton = this.add.text(width / 2, height / 2, 'PLAY', TEXT_STYLES.button)
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
            this.scene.start('GameScene')
          })
        }
      })
    })

    const instructions = this.add.text(width / 2, height * 0.75,
      'Tap tiles before they reach the bottom!\nHold blue tiles for the duration!', 
      TEXT_STYLES.instruction)
    instructions.setOrigin(0.5)
    instructions.setShadow(0, 2, '#000000', 5, true, true)
  }
}

export default MenuScene
