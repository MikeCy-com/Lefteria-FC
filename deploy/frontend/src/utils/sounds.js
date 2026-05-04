// Sound Effects using Web Audio API - no external files needed
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

const getCtx = () => {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
};

const playTone = (frequency, duration, type = "sine", volume = 0.3) => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) { /* silent fail if audio not available */ }
};

const playSequence = (notes, interval = 0.15) => {
  notes.forEach(([freq, dur, type], i) => {
    setTimeout(() => playTone(freq, dur, type || "sine", 0.25), i * interval * 1000);
  });
};

// Goal Horn - epic rising fanfare
export const playGoalSound = () => {
  playSequence([
    [523, 0.2, "square"],  // C5
    [659, 0.2, "square"],  // E5
    [784, 0.3, "square"],  // G5
    [1047, 0.5, "square"], // C6 - hold
  ], 0.12);
  // Add a deep bass hit
  setTimeout(() => playTone(130, 0.4, "sawtooth", 0.4), 0);
};

// Whistle - for fouls, start/end
export const playWhistleSound = () => {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(2800, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(3200, ctx.currentTime + 0.1);
    osc.frequency.linearRampToValueAtTime(2800, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
};

// Card sound - sharp warning beep
export const playCardSound = () => {
  playSequence([
    [880, 0.15, "square"],
    [660, 0.15, "square"],
    [880, 0.2, "square"],
  ], 0.1);
};

// Red card - deeper, more dramatic
export const playRedCardSound = () => {
  playSequence([
    [440, 0.2, "sawtooth"],
    [330, 0.2, "sawtooth"],
    [220, 0.4, "sawtooth"],
  ], 0.15);
};

// Substitution chime
export const playSubstitutionSound = () => {
  playSequence([
    [587, 0.15, "triangle"],
    [784, 0.15, "triangle"],
    [587, 0.2, "triangle"],
  ], 0.12);
};

// Notification ping (for browser notifications)
export const playNotificationSound = () => {
  playSequence([
    [880, 0.1, "sine"],
    [1100, 0.15, "sine"],
  ], 0.08);
};

// Match start/end triple whistle
export const playMatchWhistle = () => {
  playSequence([
    [2800, 0.3, "sine"],
    [2800, 0.3, "sine"],
    [2800, 0.5, "sine"],
  ], 0.4);
};

// Get sound for event type
export const getSoundForEvent = (eventType) => {
  switch (eventType) {
    case "goal":
    case "penalty_scored":
      return playGoalSound;
    case "own_goal":
      return playGoalSound;
    case "yellow_card":
    case "second_yellow":
      return playCardSound;
    case "red_card":
      return playRedCardSound;
    case "substitution":
      return playSubstitutionSound;
    case "penalty_missed":
      return playWhistleSound;
    default:
      return playNotificationSound;
  }
};

// Browser Notification
export const sendBrowserNotification = (title, body, icon) => {
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon, badge: icon });
    playNotificationSound();
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(title, { body, icon });
        playNotificationSound();
      }
    });
  }
};

// Request notification permission (call on user interaction)
export const requestNotificationPermission = () => {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
};
