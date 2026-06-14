// مدير الصوت — Web Audio API لمؤثرات صوتية مُولّدة إجرائياً (تعمل دون أي ملفات صوت)،
// مع دعم تشغيل ملفات صوت خارجية (mp3/url) لكل هدية إن وُجدت.
// كل المؤثرات مصمّمة لتتزامن مع لحظات الحركة (انطلاق، هبوط، انفجار...).

let ctx = null;
const bufferCache = new Map(); // url -> AudioBuffer
let masterGain = null;
let reverbIn = null; // مدخل صدى (reverb send) للأصوات الكبيرة
let muted = false;

// نبضة صدى مُولّدة (impulse response) لإعطاء عمق/مكان واقعي
function makeImpulse(c, dur = 2.2, decay = 2.6) {
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
  }
  return buf;
}

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(ctx.destination);
    // مسار الصدى: reverbIn → convolver → wet → master
    const reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(ctx);
    const wet = ctx.createGain();
    wet.gain.value = 0.28;
    reverbIn = ctx.createGain();
    reverbIn.connect(reverb).connect(wet).connect(masterGain);
  }
  return ctx;
}

// توصيل عقدة إلى مسار الصدى بكمية محددة
function sendReverb(node, amount = 0.5) {
  const g = ac().createGain();
  g.gain.value = amount;
  node.connect(g).connect(reverbIn);
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

// منحنى تشويه (distortion) لإضافة خشونة واقعية للمحرك/الغضب
function distortionCurve(amount = 40) {
  const n = 256;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

// ===== مكتبة المؤثرات المدمجة (طبقات + صدى لواقعية أعلى) =====
const SYNTH = {
  pop: (v) => tone("triangle", 600, 200, 0.18, v),
  chime: (v) => {
    [523, 659, 784].forEach((f, i) => tone("sine", f, f, 0.5, v * 0.6, i * 0.06));
  },
  sparkle: (v) => {
    [880, 1175, 1568, 2093, 2637].forEach((f, i) => tone("sine", f, f, 0.45, v * 0.45, i * 0.05));
  },
  fanfare: (v) => {
    // نفختان نحاسيتان مع صدى قاعة
    [523, 659, 784, 1047].forEach((f, i) => {
      const c = ac();
      const o = c.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 2600;
      const g = envGain(i * 0.12, 0.5, 0.6, v * 0.5);
      o.connect(lp).connect(g);
      sendReverb(g, 0.4);
      o.start(c.currentTime + i * 0.12);
      o.stop(c.currentTime + i * 0.12 + 0.65);
    });
  },
  cash: (v) => {
    for (let i = 0; i < 6; i++) tone("square", 1200 + i * 40, 800, 0.08, v * 0.4, i * 0.07);
    tone("sine", 1568, 2093, 0.4, v * 0.4, 0.05);
  },
  engine: (v) => {
    // محرك رياضي (فيراري): نغمة احتراق سَوتوث تتبع الدورات + توافقي حادّ + سَب +
    // تشويه + فلتر رنيني يتتبّع + انطلاقات (blips) مع طقطقة عادم + هسهسة سحب.
    const c = ac();
    const t0 = c.currentTime;
    const out = c.createGain();
    out.connect(masterGain);
    sendReverb(out, 0.18);
    // مغلّف عام (دخول/خروج ناعم)
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.exponentialRampToValueAtTime(v, t0 + 0.08);
    out.gain.setValueAtTime(v, t0 + 2.5);
    out.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.0);

    // منحنى الدورات (0..1): خمول → انطلاقات متتالية
    const revAt = [[0, 0.3], [0.4, 1.0], [0.85, 0.55], [1.25, 1.0], [1.7, 0.65], [2.1, 1.0], [2.7, 0.5]];
    const firing = (x) => 42 + x * 150; // تردد الاحتراق Hz

    const mkOsc = (type, mul, detune, gain) => {
      const o = c.createOscillator();
      o.type = type;
      o.detune.value = detune;
      o.frequency.setValueAtTime(firing(revAt[0][1]) * mul, t0);
      revAt.forEach(([tt, x]) => o.frequency.linearRampToValueAtTime(firing(x) * mul, t0 + tt));
      const og = c.createGain();
      og.gain.value = gain;
      o.connect(og);
      o.start(t0);
      o.stop(t0 + 3.05);
      return og;
    };

    const shaper = c.createWaveShaper();
    shaper.curve = distortionCurve(45);
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.Q.value = 9;
    lp.frequency.setValueAtTime(600, t0);
    revAt.forEach(([tt, x]) => lp.frequency.linearRampToValueAtTime(700 + x * 2400, t0 + tt));

    mkOsc("sawtooth", 1, 0, 0.5).connect(shaper);
    mkOsc("sawtooth", 1, 16, 0.4).connect(shaper); // جسم متنافر
    mkOsc("square", 2, 0, 0.12).connect(shaper); // صفير الدوران العالي
    shaper.connect(lp).connect(out);

    const sub = c.createOscillator(); // هدير منخفض
    sub.type = "sine";
    sub.frequency.value = 40;
    const subG = c.createGain();
    subG.gain.value = 0.4;
    sub.connect(subG).connect(out);
    sub.start(t0);
    sub.stop(t0 + 3.05);

    // طقطقة العادم عند كل انطلاقة
    [0.4, 1.25, 2.1].forEach((tt) => {
      setTimeout(() => {
        for (let i = 0; i < 4; i++) playNoise(0.05, "bandpass", 1300, 380, v * 0.3);
      }, tt * 1000);
    });
    playNoise(2.6, "bandpass", 600, 1500, v * 0.18); // سحب الهواء
  },
  jet: (v) => {
    playNoise(3.2, "bandpass", 1800, 600, v * 0.6);
    playNoise(3.2, "highpass", 4000, 6000, v * 0.2); // صفير التوربين
    tone("sawtooth", 70, 90, 3, v * 0.2); // هدير منخفض
  },
  roar: (v) => {
    // زئير أسد واقعي: مصدر سَوتوث منخفض هابط + زفير ضوضائي + غرغرة AM +
    // فورمانتات (مسار صوتي) لإعطاء طابع حيواني + صدى.
    const c = ac();
    const t0 = c.currentTime;
    const out = c.createGain();
    out.connect(masterGain);
    sendReverb(out, 0.55);
    out.gain.setValueAtTime(0.0001, t0);
    out.gain.exponentialRampToValueAtTime(v, t0 + 0.06); // هجوم سريع
    out.gain.setValueAtTime(v, t0 + 0.9);
    out.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.55);

    const src = c.createGain();
    const o1 = c.createOscillator();
    o1.type = "sawtooth";
    o1.frequency.setValueAtTime(165, t0);
    o1.frequency.exponentialRampToValueAtTime(72, t0 + 1.1);
    const o2 = c.createOscillator();
    o2.type = "sawtooth";
    o2.detune.value = -12;
    o2.frequency.setValueAtTime(150, t0);
    o2.frequency.exponentialRampToValueAtTime(64, t0 + 1.1);
    o1.connect(src);
    o2.connect(src);
    const nb = c.createBufferSource(); // زفير
    nb.buffer = noiseBuffer(1.5);
    const ng = c.createGain();
    ng.gain.value = 0.5;
    nb.connect(ng).connect(src);

    // غرغرة AM (هزّ المكسب بتردد منخفض ينخفض تدريجياً)
    const growl = c.createOscillator();
    growl.type = "sine";
    growl.frequency.setValueAtTime(30, t0);
    growl.frequency.linearRampToValueAtTime(17, t0 + 1.1);
    const growlG = c.createGain();
    growlG.gain.value = 0.4;
    const amp = c.createGain();
    amp.gain.value = 0.6;
    growl.connect(growlG).connect(amp.gain);
    src.connect(amp);

    // فورمانتات الأسد
    [[480, 8, 0.9], [1000, 9, 0.5], [2300, 10, 0.22]].forEach(([f, q, g]) => {
      const bp = c.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = f;
      bp.Q.value = q;
      const fg = c.createGain();
      fg.gain.value = g;
      amp.connect(bp).connect(fg).connect(out);
    });
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    const lg = c.createGain();
    lg.gain.value = 0.6;
    amp.connect(lp).connect(lg).connect(out);

    [o1, o2, growl].forEach((o) => {
      o.start(t0);
      o.stop(t0 + 1.55);
    });
    nb.start(t0);
    nb.stop(t0 + 1.5);
  },
  rocket: (v) => {
    playNoise(3, "lowpass", 200, 1300, v * 0.7);
    const o = ac().createOscillator();
    const g = envGain(0, 0.4, 2.6, v);
    o.type = "sawtooth";
    o.frequency.setValueAtTime(70, ac().currentTime);
    o.frequency.linearRampToValueAtTime(230, ac().currentTime + 2.4);
    o.connect(g);
    sendReverb(g, 0.3);
    o.start();
    o.stop(ac().currentTime + 2.7);
  },
  explosion: (v) => {
    // دوي + جسم منخفض + طقطقة
    tone("sine", 130, 38, 0.7, v * 0.9);
    playNoise(0.8, "lowpass", 1400, 60, v);
    for (let i = 0; i < 6; i++) playNoise(0.05, "highpass", 3000, 5000, v * 0.25); // crackle
  },
  fireworks: (v) => {
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        playNoise(0.45, "lowpass", 1100, 90, v * 0.7);
        const o = ac().createOscillator();
        const g = envGain(0, 0.5, 0.35, v * 0.5);
        o.type = "sine";
        o.frequency.setValueAtTime(220, ac().currentTime);
        o.frequency.exponentialRampToValueAtTime(60, ac().currentTime + 0.3);
        o.connect(g);
        sendReverb(g, 0.6);
        o.start();
        o.stop(ac().currentTime + 0.4);
        for (let j = 0; j < 8; j++) playNoise(0.04, "highpass", 4000, 6000, v * 0.18); // فرقعات صغيرة
      }, i * 320);
    }
  },
  build: (v) => {
    [262, 330, 392, 523, 659].forEach((f, i) => tone("triangle", f, f, 0.35, v * 0.5, i * 0.25));
  },
  whoosh: (v) => playNoise(1.1, "bandpass", 300, 2200, v * 0.6),
  horn: (v) => {
    // بوق يخت: نغمتان منخفضتان مع صدى بحري
    [140, 176].forEach((f, i) => {
      const c = ac();
      const o = c.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = f;
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1200;
      const g = envGain(i * 0.02, 0.5, 1.2, v * 0.45);
      o.connect(lp).connect(g);
      sendReverb(g, 0.5);
      o.start(c.currentTime);
      o.stop(c.currentTime + 1.25);
    });
  },
  cosmic: (v) => {
    [440, 554, 659, 880].forEach((f, i) => {
      const c = ac();
      const o = c.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(f, c.currentTime + i * 0.15);
      o.frequency.linearRampToValueAtTime(f * 1.5, c.currentTime + i * 0.15 + 1.2);
      const g = envGain(i * 0.15, 0.4, 1.2, v * 0.4);
      o.connect(g);
      sendReverb(g, 0.7);
      o.start(c.currentTime + i * 0.15);
      o.stop(c.currentTime + i * 0.15 + 1.3);
    });
    playNoise(2, "bandpass", 200, 1500, v * 0.18);
  },
  countdown: (v) => tone("square", 880, 880, 0.12, v * 0.5),

  // ===== أصوات التفاعلات =====
  clap: (v) => {
    // تصفيق: نبضات ضوضاء قصيرة عشوائية عبر bandpass + صدى خفيف = جمهور
    for (let i = 0; i < 9; i++) {
      const delay = i * 0.06 + Math.random() * 0.03;
      setTimeout(() => playNoise(0.06, "bandpass", 1400, 1100, v * (0.4 + Math.random() * 0.3)), delay * 1000);
    }
  },
  laugh: (v) => {
    // "ها ها ها" — نغمات قصيرة متذبذبة هابطة
    for (let i = 0; i < 4; i++) {
      tone("triangle", 360 - i * 20, 260 - i * 20, 0.12, v * 0.5, i * 0.15);
    }
  },
  cry: (v) => {
    // أنين هابط مع اهتزاز
    const c = ac();
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(520, c.currentTime);
    o.frequency.exponentialRampToValueAtTime(240, c.currentTime + 0.9);
    const vib = c.createOscillator();
    vib.frequency.value = 6;
    const vibG = c.createGain();
    vibG.gain.value = 18;
    vib.connect(vibG).connect(o.frequency);
    const g = envGain(0, 0.4, 1, v * 0.5);
    o.connect(g);
    o.start();
    vib.start();
    o.stop(c.currentTime + 1.05);
    vib.stop(c.currentTime + 1.05);
  },
  angry: (v) => {
    // طنين منخفض مشوّه قصير
    const c = ac();
    const o = c.createOscillator();
    o.type = "square";
    o.frequency.setValueAtTime(140, c.currentTime);
    o.frequency.linearRampToValueAtTime(90, c.currentTime + 0.5);
    const sh = c.createWaveShaper();
    sh.curve = distortionCurve(50);
    const g = envGain(0, 0.4, 0.55, v * 0.5);
    o.connect(sh).connect(g);
    o.start();
    o.stop(c.currentTime + 0.6);
  },
  party: (v) => {
    [659, 784, 988, 1319].forEach((f, i) => tone("sine", f, f, 0.4, v * 0.45, i * 0.07));
    for (let i = 0; i < 4; i++) tone("square", 1400, 900, 0.06, v * 0.3, i * 0.1);
  },
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
