import Phaser from 'phaser'

class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
  }

  create() {
    const { width, height } = this.cameras.main

    const title = this.add.text(width / 2, height / 3, "Sophie's Tiles", {
      fontSize: '48px',
      fill: '#ffffff',
      fontStyle: 'bold'
    })
    title.setOrigin(0.5)

    const playButton = this.add.text(width / 2, height / 2, 'PLAY', {
      fontSize: '36px',
      fill: '#00ff00',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 }
    })
    playButton.setOrigin(0.5)
    playButton.setInteractive({ useHandCursor: true })

    playButton.on('pointerover', () => {
      playButton.setScale(1.1)
    })

    playButton.on('pointerout', () => {
      playButton.setScale(1)
    })

    playButton.on('pointerdown', () => {
      this.scene.start('GameScene')
    })

    const instructions = this.add.text(width / 2, height * 0.75,
      'Tap tiles before they reach the bottom!\nHold blue tiles for the duration!', {
      fontSize: '18px',
      fill: '#aaaaaa',
      align: 'center'
    })
    instructions.setOrigin(0.5)
  }
}

export default MenuScene
