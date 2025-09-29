import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { phaserConfig } from '../game/config';
import PreloadScene from '../game/scenes/PreloadScene';
import MenuScene from '../game/scenes/MenuScene';
import GameScene from '../game/scenes/GameScene';
import GameOverScene from '../game/scenes/GameOverScene';
import styles from './GameContainer.module.css';

function GameContainer() {
  const gameRef = useRef(null);

  useEffect(() => {
    const config = {
      ...phaserConfig,
      scene: [PreloadScene, MenuScene, GameScene, GameOverScene]
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, []);

  return (
    <div className={styles.gameWrapper}>
      <div id="phaser-container" className={styles.gameContainer} />
    </div>
  );
}

export default GameContainer;