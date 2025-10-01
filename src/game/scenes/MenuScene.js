import Phaser from 'phaser'
import { TEXT_STYLES } from '../styles'

class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    const { width, height } = this.cameras.main

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
    buttonBg.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 20)
    
    const playButton = this.add.text(width / 2, height / 2, 'PLAY', TEXT_STYLES.button)
    playButton.setOrigin(0.5)
    playButton.setShadow(0, 4, '#000000', 10, true, true)
    playButton.setInteractive({ useHandCursor: true })

    playButton.on('pointerover', () => {
      playButton.setScale(1.1)
      buttonBg.clear()
      buttonBg.fillGradientStyle(0x00ffaa, 0x00ffaa, 0x00dd77, 0x00dd77, 1)
      buttonBg.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 20)
    })

    playButton.on('pointerout', () => {
      playButton.setScale(1)
      buttonBg.clear()
      buttonBg.fillGradientStyle(0x00ff88, 0x00ff88, 0x00cc66, 0x00cc66, 1)
      buttonBg.fillRoundedRect(buttonX, buttonY, buttonWidth, buttonHeight, 20)
    })

    playButton.on('pointerdown', () => {
      this.scene.start('GameScene')
    })

    const instructions = this.add.text(width / 2, height * 0.75,
      'Tap tiles before they reach the bottom!\nHold blue tiles for the duration!', 
      TEXT_STYLES.instruction)
    instructions.setOrigin(0.5)
    instructions.setShadow(0, 2, '#000000', 5, true, true)
  }
}

export default MenuScene
