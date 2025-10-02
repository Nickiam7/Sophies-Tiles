import Phaser from 'phaser'
import { GAME_CONFIG } from '../config'

class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' })
  }

  preload() {
    // Set background color
    this.cameras.main.setBackgroundColor(GAME_CONFIG.colors.background)
    this.createLoadingBar()
  }

  createLoadingBar() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    
    // Add subtle border/glow around the entire scene
    const border = this.add.graphics()
    border.lineStyle(3, 0x00ccff, 0.3)
    border.strokeRect(10, 10, width - 20, height - 20)
    
    // Add inner glow
    const innerGlow = this.add.graphics()
    innerGlow.lineStyle(2, 0x9b59ff, 0.2)
    innerGlow.strokeRect(15, 15, width - 30, height - 30)

    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading Sophie\'s Tiles...', {
      fontFamily: 'Poppins',
      fontSize: '36px',
      fontStyle: '600',
      fill: '#ffffff',
      stroke: '#151937',
      strokeThickness: 3
    })
    loadingText.setOrigin(0.5, 0.5)
    loadingText.setShadow(0, 4, '#000000', 10, true, true)

    const progressBar = this.add.graphics()
    const progressBox = this.add.graphics()
    progressBox.fillStyle(0x151937, 0.9)
    progressBox.fillRect(width / 2 - 160, height / 2, 320, 50)
    progressBox.lineStyle(2, 0x00ccff, 0.3)
    progressBox.strokeRect(width / 2 - 160, height / 2, 320, 50)

    this.load.on('progress', (value) => {
      progressBar.clear()
      progressBar.fillGradientStyle(0x00ff88, 0x00ff88, 0x00ccff, 0x00ccff, 1)
      progressBar.fillRect(width / 2 - 150, height / 2 + 10, 300 * value, 30)
    })

    this.load.on('complete', () => {
      progressBar.destroy()
      progressBox.destroy()
      loadingText.destroy()
    })
  }

  create() {
    // Fade out before transitioning
    this.cameras.main.fadeOut(300, 0, 0, 0)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('MenuScene')
    })
  }
}

export default PreloadScene
