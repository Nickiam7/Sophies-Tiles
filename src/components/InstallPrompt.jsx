import { useState, useEffect } from 'react';
import styles from './InstallPrompt.module.css';

function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);

  useEffect(() => {
    // Detect if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone || 
                        document.referrer.includes('android-app://');
    setIsInStandaloneMode(isStandalone);

    // Check if prompt was dismissed before (store for 7 days)
    const dismissedTime = localStorage.getItem('installPromptDismissed');
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    
    if (dismissedTime && Date.now() - parseInt(dismissedTime) < sevenDaysInMs) {
      return;
    }

    // Show prompt after 30 seconds if iOS and not in standalone
    if (isIOSDevice && !isStandalone) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 30000); // 30 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  if (!showPrompt || !isIOS || isInStandaloneMode) {
    return null;
  }

  return (
    <div className={styles.promptOverlay}>
      <div className={styles.promptCard}>
        <button className={styles.closeButton} onClick={handleDismiss}>✕</button>
        
        <div className={styles.iconContainer}>
          <img src="/icon-192.png" alt="Sophie's Tiles" className={styles.appIcon} />
        </div>
        
        <h2 className={styles.title}>Add to Home Screen</h2>
        
        <p className={styles.description}>
          Install Sophie's Tiles for the best experience!
        </p>
        
        <div className={styles.instructions}>
          <div className={styles.step}>
            <span className={styles.stepNumber}>1</span>
            <span>Tap the <span className={styles.shareIcon}>⎙</span> Share button</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNumber}>2</span>
            <span>Scroll down and tap "Add to Home Screen"</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNumber}>3</span>
            <span>Tap "Add" to install</span>
          </div>
        </div>
        
        <button className={styles.dismissButton} onClick={handleDismiss}>
          Maybe Later
        </button>
      </div>
    </div>
  );
}

export default InstallPrompt;