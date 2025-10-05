// Secret codes configuration
export const SECRET_CODES = {
  '1016': {
    name: 'Mega Lives',
    description: '50 Lives Activated!',
    effect: 'megaLives',
    value: 50,
    color: '#ff6b9d'
  },
  '0731': {
    name: 'Billion Points',
    description: 'Billion Points Activated!',
    effect: 'billionPoints',
    value: 1000000000,
    color: '#ffd700'
  },
  '1220': {
    name: 'Point Multiplier',
    description: '5X Points Multiplier Activated!',
    effect: 'pointMultiplier',
    value: 5,
    color: '#9b59ff'
  },
  '1234': {
    name: 'Slow Motion',
    description: 'Slow Motion Mode Activated!',
    effect: 'slowMotion',
    value: 0.5, // 50% speed
    color: '#00ccff'
  }
};

// Store active codes in session
export const activeCodes = new Set();

export function validateCode(code) {
  const secretCode = SECRET_CODES[code];
  if (secretCode) {
    activeCodes.add(code);
    return {
      valid: true,
      ...secretCode
    };
  }
  return {
    valid: false,
    description: 'Invalid Code'
  };
}

export function getActiveEffects() {
  const effects = {
    lives: 3, // default
    speedMultiplier: 1.0, // default
    startingPoints: 0, // default
    pointMultiplier: 1 // default
  };
  
  activeCodes.forEach(code => {
    const codeData = SECRET_CODES[code];
    if (codeData.effect === 'megaLives') {
      effects.lives = codeData.value;
    } else if (codeData.effect === 'slowMotion') {
      effects.speedMultiplier = codeData.value;
    } else if (codeData.effect === 'billionPoints') {
      effects.startingPoints = codeData.value;
    } else if (codeData.effect === 'pointMultiplier') {
      effects.pointMultiplier = codeData.value;
    }
  });
  
  return effects;
}

export function clearCodes() {
  activeCodes.clear();
}