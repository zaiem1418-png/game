// مدير الصوت — Web Audio API لمؤثرات صوتية مُولّدة إجرائياً (تعمل دون أي ملفات صوت)،
// مع دعم تشغيل ملفات صوت خارجية (mp3/url) لكل هدية إن وُجدت.
// كل المؤثرات مصمّمة لتتزامن مع لحظات الحركة (انطلاق، هبوط، انفجار...).

let ctx = null;
const bufferCache = new Map(); // url -> AudioBuffer
let masterGain = null;
let muted = false;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

// يجب استدعاؤها بعد تفاعل المستخدم (سياسة المتصفحات) — نناديها عند الدخول/أول نقرة.
export function unlockAudio() {
  try {
    const c = ac();
    if (c.state === "suspended") c.resume();
  } catch {}
}

export function setMuted(v) {
  muted = v;
  if (masterGain) masterGain.gain.value = v ? 0 : 0.9;
}
export function isMuted() {
  return muted;
}

function envGain(start, peak, dur, vol = 1) {
  const c = ac();
  const g = c.createGain();
  const t = c.currentTime + start;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * vol), t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(masterGain);
  return g;
}

function noiseBuffer(dur) {
  const c = ac();
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

function playNoise(dur, filterType, freqStart, freqEnd, vol) {
  const c = ac();
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(dur);
  const f = c.createBiquadFilter();
  f.type = filterType;
  f.frequency.setValueAtTime(freqStart, c.currentTime);
  f.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), c.currentTime + dur);
  const g = envGain(0, 0.9, dur, vol);
  src.connect(f).connect(g);
  src.start();
  src.stop(c.currentTime + dur + 0.05);
}

function tone(type, fStart, fEnd, dur, vol, when = 0) {
  const c = ac();
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(fStart, c.currentTime + when);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, fEnd), c.currentTime + when + dur);
  const g = envGain(when, 0.6, dur, vol);
  o.connect(g);
  o.start(c.currentTime + when);
  o.stop(c.currentTime + when + dur + 0.05);
}

// ===== مكتبة المؤثرات المدمجة =====
const SYNTH = {
  pop: (v) => tone("triangle", 600, 200, 0.18, v),
  chime: (v) => {
    [523, 659, 784].forEach((f, i) => tone("sine", f, f, 0.5, v * 0.6, i * 0.06));
  },
  sparkle: (v) => {
    [880, 1175, 1568, 2093].forEach((f, i) => tone("sine", f, f, 0.4, v * 0.5, i * 0.05));
  },
  fanfare: (v) => {
    [523, 659, 784, 1047].forEach((f, i) => tone("sawtooth", f, f, 0.5, v * 0.45, i * 0.12));
  },
  cash: (v) => {
    for (let i = 0; i < 6; i++) tone("square", 1200 + i * 40, 800, 0.08, v * 0.4, i * 0.07);
  },
  engine: (v) => {
    // محرك رياضي: ساو-توث منخفض يرتفع + فلتر
    const c = ac();
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(60, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(220, c.currentTime + 1.2);
    o.frequency.exponentialRampToValueAtTime(140, c.currentTime + 2.4);
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 900;
    const g = envGain(0, 0.5, 2.6, v);
    o.connect(f).connect(g);
    o.start();
    o.stop(c.currentTime + 2.7);
    playNoise(2.4, "bandpass", 400, 800, v * 0.3); // احتكاك إطارات
  },
  jet: (v) => playNoise(3.2, "bandpass", 1800, 600, v * 0.7),
  roar: (v) => {
    const c = ac();
    const o = c.createOscillator();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(180, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(70, c.currentTime + 0.9);
    const g = envGain(0, 0.8, 1.3, v);
    o.connect(g);
    o.start();
    o.stop(c.currentTime + 1.4);
    playNoise(1.2, "lowpass", 800, 300, v * 0.6);
  },
  rocket: (v) => {
    playNoise(3, "lowpass", 200, 1200, v * 0.7);
    tone("sawtooth", 80, 200, 2.6, v * 0.4);
  },
  explosion: (v) => {
    playNoise(0.7, "lowpass", 1200, 60, v);
    tone("sine", 120, 40, 0.6, v * 0.8);
  },
  fireworks: (v) => {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        playNoise(0.4, "lowpass", 1000, 100, v * 0.7);
        tone("sine", 200, 60, 0.3, v * 0.5);
      }, i * 320);
    }
  },
  build: (v) => {
    [262, 330, 392, 523, 659].forEach((f, i) => tone("triangle", f, f, 0.3, v * 0.5, i * 0.25));
  },
  whoosh: (v) => playNoise(1.1, "bandpass", 300, 2000, v * 0.6),
  horn: (v) => {
    tone("sawtooth", 140, 140, 1.1, v * 0.5);
    tone("sawtooth", 175, 175, 1.1, v * 0.4, 0.02);
  },
  cosmic: (v) => {
    [440, 554, 659, 880].forEach((f, i) => tone("sine", f, f * 1.5, 1.2, v * 0.4, i * 0.15));
    playNoise(2, "bandpass", 200, 1500, v * 0.2);
  },
  countdown: (v) => tone("square", 880, 880, 0.12, v * 0.5),
};

async function loadBuffer(url) {
  if (bufferCache.has(url)) return bufferCache.get(url);
  const res = await fetch(url);
  const arr = await res.arrayBuffer();
  const buf = await ac().decodeAudioData(arr);
  bufferCache.set(url, buf);
  return buf;
}

async function playUrl(url, vol) {
  try {
    const buf = await loadBuffer(url);
    const c = ac();
    const src = c.createBufferSource();
    src.buffer = buf;
    const g = c.createGain();
    g.gain.value = vol;
    src.connect(g).connect(masterGain);
    src.start();
  } catch (e) {
    console.warn("تعذّر تشغيل الصوت:", url, e.message);
  }
}

/**
 * تشغيل صوت هدية. sound يمكن أن يكون:
 *  - معرّف مدمج (engine, roar, rocket, ...)
 *  - رابط ملف صوت (يبدأ بـ http أو /)
 */
export function playSound(sound, volume = 0.8) {
  if (!sound || muted) return;
  try {
    ac();
    if (/^https?:\/\//.test(sound) || sound.startsWith("/") || sound.endsWith(".mp3")) {
      playUrl(sound, volume);
    } else if (SYNTH[sound]) {
      SYNTH[sound](volume);
    }
  } catch (e) {
    /* صامت في حال فشل الصوت */
  }
}

export const BUILTIN_SOUNDS = Object.keys(SYNTH);
