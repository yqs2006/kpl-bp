let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

let lastTickSecond = -1;

export function playSound(name) {
  switch (name) {
    case 'tick':
      playTone(800, 0.08, 'square', 0.12);
      break;
    case 'warning':
      playTone(500, 0.2, 'sawtooth', 0.25);
      break;
    case 'confirm':
      {
        const ctx = getAudioContext();
        [523, 659, 784].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, ctx.currentTime + i * 0.1);
          g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.1);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.25);
          o.connect(g); g.connect(ctx.destination);
          o.start(ctx.currentTime + i * 0.1);
          o.stop(ctx.currentTime + i * 0.1 + 0.25);
        });
      }
      break;
    case 'switch':
      playTone(440, 0.12, 'square', 0.15);
      break;
    case 'peak_reveal':
      {
        const ctx = getAudioContext();
        [261, 329, 392, 523].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, ctx.currentTime + i * 0.15);
          g.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.15);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.5);
          o.connect(g); g.connect(ctx.destination);
          o.start(ctx.currentTime + i * 0.15);
          o.stop(ctx.currentTime + i * 0.15 + 0.5);
        });
      }
      break;
    default:
      break;
  }
}

export function handleTimerSound(timer, isComplete) {
  if (isComplete) { lastTickSecond = -1; return; }
  if (timer <= 5 && timer > 0 && timer !== lastTickSecond) {
    playSound('warning');
    lastTickSecond = timer;
  } else if (timer > 5 && timer !== lastTickSecond) {
    playSound('tick');
    lastTickSecond = timer;
  }
}

export function resetTimerSound() {
  lastTickSecond = -1;
}

let bgmNodes = [];

export function playPeakBGM() {
  stopPeakBGM();
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(80, ctx.currentTime);
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start();
  bgmNodes.push(osc, gain);
}

export function stopPeakBGM() {
  bgmNodes.forEach(n => { try { n.stop(); } catch (e) {} });
  bgmNodes = [];
}