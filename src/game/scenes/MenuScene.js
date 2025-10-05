import Phaser from 'phaser'
import { TEXT_STYLES } from '../styles'
import { validateCode, getActiveEffects, activeCodes } from '../codes'

class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' })
    this.selectedDifficulty = 'easy' // Default to easy
    this.showCodeInput = false
    this.codeInput = null
    this.flashMessage = null
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
            // Pass active code effects to GameScene
            const effects = getActiveEffects()
            this.scene.start('GameScene', { 
              difficulty: this.selectedDifficulty,
              ...effects
            })
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
    
    // Add Enter Code button
    this.createEnterCodeButton(width, height)
    
    // Create code input modal (hidden initially)
    this.createCodeModal(width, height)

    const instructions = this.add.text(width / 2, height * 0.87,
      'Tap tiles before they reach the bottom!\nHold blue tiles for the duration!', 
      TEXT_STYLES.instruction)
    instructions.setOrigin(0.5)
    instructions.setShadow(0, 2, '#000000', 5, true, true)
    
    // Show active codes indicator if any
    if (activeCodes.size > 0) {
      this.showActiveCodesIndicator(width, height)
    }
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
  
  createEnterCodeButton(width, height) {
    const codeButton = this.add.text(width / 2, height * 0.74, 'ENTER CODE', {
      fontFamily: 'Poppins',
      fontSize: '20px',
      fontStyle: '600',
      fill: '#9b59ff',
      stroke: '#151937',
      strokeThickness: 2
    })
    codeButton.setOrigin(0.5)
    codeButton.setInteractive({ useHandCursor: true })
    codeButton.setShadow(0, 2, '#000000', 5, true, true)
    
    // Underline effect
    const underline = this.add.graphics()
    underline.lineStyle(2, 0x9b59ff, 0.5)
    underline.lineBetween(
      width / 2 - codeButton.width / 2,
      height * 0.74 + 15,
      width / 2 + codeButton.width / 2,
      height * 0.74 + 15
    )
    
    codeButton.on('pointerover', () => {
      codeButton.setFill('#b47fff')
      underline.clear()
      underline.lineStyle(2, 0xb47fff, 1)
      underline.lineBetween(
        width / 2 - codeButton.width / 2,
        height * 0.74 + 15,
        width / 2 + codeButton.width / 2,
        height * 0.74 + 15
      )
    })
    
    codeButton.on('pointerout', () => {
      codeButton.setFill('#9b59ff')
      underline.clear()
      underline.lineStyle(2, 0x9b59ff, 0.5)
      underline.lineBetween(
        width / 2 - codeButton.width / 2,
        height * 0.74 + 15,
        width / 2 + codeButton.width / 2,
        height * 0.74 + 15
      )
    })
    
    codeButton.on('pointerdown', () => {
      this.showCodeModal()
    })
  }
  
  createCodeModal(width, height) {
    // Create modal background (hidden initially)
    this.modalBg = this.add.graphics()
    this.modalBg.fillStyle(0x000000, 0.8)
    this.modalBg.fillRect(0, 0, width, height)
    this.modalBg.setInteractive()
    this.modalBg.setDepth(1000)
    this.modalBg.setVisible(false)
    
    // Modal container
    this.modalContainer = this.add.container(width / 2, height / 2)
    this.modalContainer.setDepth(1001)
    this.modalContainer.setVisible(false)
    
    // Modal background box
    const modalBox = this.add.graphics()
    modalBox.fillGradientStyle(0x151937, 0x151937, 0x0a0e27, 0x0a0e27, 1)
    modalBox.fillRoundedRect(-200, -100, 400, 200, 20)
    modalBox.lineStyle(3, 0x9b59ff, 0.5)
    modalBox.strokeRoundedRect(-200, -100, 400, 200, 20)
    this.modalContainer.add(modalBox)
    
    // Title
    const modalTitle = this.add.text(0, -60, 'ENTER SECRET CODE', {
      fontFamily: 'Poppins',
      fontSize: '28px',
      fontStyle: '700',
      fill: '#ffffff'
    })
    modalTitle.setOrigin(0.5)
    this.modalContainer.add(modalTitle)
    
    // Create HTML input field (styled to match game)
    this.createCodeInputField()
    
    // Submit button
    const submitBg = this.add.graphics()
    submitBg.fillGradientStyle(0x00ff88, 0x00ff88, 0x00cc66, 0x00cc66, 1)
    submitBg.fillRoundedRect(-60, 20, 120, 40, 10)
    this.modalContainer.add(submitBg)
    
    const submitButton = this.add.text(0, 40, 'SUBMIT', {
      fontFamily: 'Poppins',
      fontSize: '20px',
      fontStyle: '600',
      fill: '#0a0e27'
    })
    submitButton.setOrigin(0.5)
    submitButton.setInteractive({ useHandCursor: true })
    this.modalContainer.add(submitButton)
    
    submitButton.on('pointerdown', () => {
      this.submitCode()
    })
    
    // Close button
    const closeButton = this.add.text(180, -80, '✕', {
      fontSize: '32px',
      fill: '#ffffff'
    })
    closeButton.setOrigin(0.5)
    closeButton.setInteractive({ useHandCursor: true })
    this.modalContainer.add(closeButton)
    
    closeButton.on('pointerdown', () => {
      this.hideCodeModal()
    })
    
    // Click outside to close
    this.modalBg.on('pointerdown', () => {
      this.hideCodeModal()
    })
  }
  
  createCodeInputField() {
    // Create a text display for the code
    this.codeDisplay = this.add.text(0, -10, '____', {
      fontFamily: 'Poppins',
      fontSize: '32px',
      fontStyle: '600',
      fill: '#666666',
      fixedWidth: 150,
      align: 'center'
    })
    this.codeDisplay.setOrigin(0.5)
    this.modalContainer.add(this.codeDisplay)
    
    // Input box visual
    this.inputBox = this.add.graphics()
    this.inputBox.lineStyle(2, 0x9b59ff, 1)
    this.inputBox.strokeRoundedRect(-80, -25, 160, 40, 5)
    this.modalContainer.add(this.inputBox)
    
    // Make input area clickable to focus HTML input on mobile
    const inputHitArea = this.add.rectangle(0, -10, 160, 40)
    inputHitArea.setInteractive({ useHandCursor: true })
    inputHitArea.setAlpha(0.01) // Nearly invisible but interactive
    this.modalContainer.add(inputHitArea)
    
    inputHitArea.on('pointerdown', () => {
      // Focus HTML input when tapping the input area
      if (this.htmlInput) {
        this.htmlInput.focus()
      }
    })
    
    // Create HTML input element for mobile keyboard support
    this.createHTMLInput()
    
    // Store entered code
    this.enteredCode = ''
  }
  
  createHTMLInput() {
    // Create invisible HTML input that triggers mobile keyboard
    const input = document.createElement('input')
    input.type = 'tel' // 'tel' triggers numeric keyboard on mobile
    input.inputMode = 'numeric' // Additional hint for numeric input
    input.pattern = '[0-9]*' // iOS specific pattern for numeric keyboard
    input.maxLength = 4
    input.id = 'code-input'
    input.style.position = 'absolute'
    input.style.left = '-9999px' // Position off-screen but still focusable
    input.style.opacity = '0'
    input.style.width = '1px'
    input.style.height = '1px'
    input.style.border = 'none'
    input.autocomplete = 'off'
    input.autocorrect = 'off'
    input.autocapitalize = 'off'
    
    document.body.appendChild(input)
    this.htmlInput = input
    
    // Handle input events
    input.addEventListener('input', (e) => {
      // Filter to only allow digits
      const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4)
      e.target.value = value
      this.enteredCode = value
      
      // Update display with proper formatting
      if (value.length === 0) {
        this.codeDisplay.setText('____')
        this.codeDisplay.setFill('#666666')
      } else {
        const display = value.padEnd(4, '_')
        this.codeDisplay.setText(display)
        this.codeDisplay.setFill('#ffffff')
      }
    })
    
    // Handle focus/blur for visual feedback
    input.addEventListener('focus', () => {
      if (this.inputBox) {
        this.inputBox.clear()
        this.inputBox.lineStyle(3, 0xb47fff, 1)
        this.inputBox.strokeRoundedRect(-80, -25, 160, 40, 5)
      }
    })
    
    input.addEventListener('blur', () => {
      if (this.inputBox) {
        this.inputBox.clear()
        this.inputBox.lineStyle(2, 0x9b59ff, 1)
        this.inputBox.strokeRoundedRect(-80, -25, 160, 40, 5)
      }
    })
    
    // Handle submit on enter/go
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        this.submitCode()
      }
    })
  }
  
  showCodeModal() {
    this.modalBg.setVisible(true)
    this.modalContainer.setVisible(true)
    this.enteredCode = ''
    this.codeDisplay.setText('____')
    this.codeDisplay.setFill('#666666')
    
    // Reset and focus HTML input for mobile keyboard
    if (this.htmlInput) {
      this.htmlInput.value = ''
      // Small delay to ensure modal is visible before focusing
      setTimeout(() => {
        this.htmlInput.focus()
      }, 100)
    }
    
    // Enable keyboard input for desktop
    this.input.keyboard.on('keydown', this.handleKeyDown, this)
  }
  
  hideCodeModal() {
    this.modalBg.setVisible(false)
    this.modalContainer.setVisible(false)
    this.input.keyboard.off('keydown', this.handleKeyDown, this)
    
    // Blur HTML input to hide keyboard
    if (this.htmlInput) {
      this.htmlInput.blur()
    }
  }
  
  handleKeyDown(event) {
    if (event.key >= '0' && event.key <= '9') {
      if (this.enteredCode.length < 4) {
        this.enteredCode += event.key
        this.codeDisplay.setText(this.enteredCode)
      }
    } else if (event.key === 'Backspace') {
      this.enteredCode = this.enteredCode.slice(0, -1)
      this.codeDisplay.setText(this.enteredCode)
    } else if (event.key === 'Enter') {
      this.submitCode()
    }
  }
  
  submitCode() {
    if (this.enteredCode.length !== 4) {
      this.showFlashMessage('Code must be 4 digits', '#ff3366')
      return
    }
    
    const result = validateCode(this.enteredCode)
    
    if (result.valid) {
      this.showFlashMessage(result.description, result.color || '#00ff88')
      this.hideCodeModal()
      
      // Update active codes indicator
      this.showActiveCodesIndicator(this.cameras.main.width, this.cameras.main.height)
    } else {
      this.showFlashMessage(result.description, '#ff3366')
      this.enteredCode = ''
      this.codeDisplay.setText('')
    }
  }
  
  showFlashMessage(message, color = '#ffffff') {
    const { width, height } = this.cameras.main
    
    // Remove existing flash message if any
    if (this.flashMessage) {
      this.flashMessage.destroy()
      if (this.flashBg) this.flashBg.destroy()
    }
    
    // Create flash message background
    this.flashBg = this.add.graphics()
    this.flashBg.fillStyle(0x000000, 0.9)
    this.flashBg.fillRoundedRect(width / 2 - 200, height * 0.35 - 30, 400, 60, 15)
    this.flashBg.setDepth(2000)
    
    // Create flash message text
    this.flashMessage = this.add.text(width / 2, height * 0.35, message, {
      fontFamily: 'Poppins',
      fontSize: '24px',
      fontStyle: '700',
      fill: color,
      stroke: '#000000',
      strokeThickness: 4
    })
    this.flashMessage.setOrigin(0.5)
    this.flashMessage.setDepth(2001)
    
    // Animate in
    this.flashMessage.setScale(0)
    this.flashBg.setScale(0)
    
    this.tweens.add({
      targets: [this.flashMessage, this.flashBg],
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Fade out after delay
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: [this.flashMessage, this.flashBg],
            alpha: 0,
            duration: 500,
            onComplete: () => {
              if (this.flashMessage) this.flashMessage.destroy()
              if (this.flashBg) this.flashBg.destroy()
              this.flashMessage = null
              this.flashBg = null
            }
          })
        })
      }
    })
  }
  
  showActiveCodesIndicator(width, height) {
    // Remove existing indicator if any
    if (this.codesIndicator) {
      this.codesIndicator.destroy()
    }
    
    if (activeCodes.size > 0) {
      this.codesIndicator = this.add.text(width - 20, 20, `★ ${activeCodes.size} CODE${activeCodes.size > 1 ? 'S' : ''} ACTIVE`, {
        fontFamily: 'Poppins',
        fontSize: '16px',
        fontStyle: '600',
        fill: '#ffd700',
        stroke: '#000000',
        strokeThickness: 2
      })
      this.codesIndicator.setOrigin(1, 0)
      this.codesIndicator.setShadow(0, 2, '#ff6600', 10, true, true)
      
      // Pulsing animation
      this.tweens.add({
        targets: this.codesIndicator,
        scale: { from: 1, to: 1.1 },
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    }
  }
  
  shutdown() {
    // Clean up HTML input when scene is destroyed
    if (this.htmlInput) {
      this.htmlInput.remove()
      this.htmlInput = null
    }
  }
}

export default MenuScene
