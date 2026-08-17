// مؤثرات صوت البلوت: نداءات صوتية عربية (Web Speech) + نغمات (Web Audio).
// النداءات: أول / ثاني / صن / حكم / أشكل / بس … ونغمات للتوزيع والرمي والأكلة والفوز والقهر.

let ctx = null;
function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

let muted = false;
try {
  muted = localStorage.getItem("bl_muted") === "1";
} catch {}

export function isMuted() {
  return muted;
}
export function setMuted(v) {
  muted = !!v;
  try {
    localStorage.setItem("bl_muted", muted ? "1" : "0");
  } catch {}
  if (muted && typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// يفكّ قفل الصوت على الجوال بعد أول لمسة من المستخدم.
export function unlock() {
  ac();
  if (typeof window !== "undefined" && window.speechSynthesis && !muted) {
    try {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch {}
  }
}

function tone(freq, dur = 0.12, type = "sine", gain = 0.18, when = 0) {
  const c = ac();
  if (!c || muted) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

let arVoice = null;
function pickVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const vs = window.speechSynthesis.getVoices() || [];
  arVoice =
    vs.find((v) => /^ar/i.test(v.lang)) ||
    vs.find((v) => /arab/i.test(v.name)) ||
    null;
}
if (typeof window !== "undefined" && window.speechSynthesis) {
  pickVoice();
  window.speechSynthesis.onvoiceschanged = pickVoice;
}

export function say(text) {
  if (muted) return;
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  if (!synth) return;
  try {
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-SA";
    if (arVoice) u.voice = arVoice;
    u.rate = 0.98;
    u.pitch = 1;
    synth.speak(u);
  } catch {}
}

// نغمات مصاحبة قصيرة
export const sfx = {
  deal() {
    tone(523, 0.06, "triangle", 0.12);
    tone(659, 0.06, "triangle", 0.12, 0.07);
    tone(440, 0.09, "triangle", 0.1, 0.15);
  },
  play() {
    tone(300, 0.07, "square", 0.13);
  },
  trick() {
    tone(680, 0.09, "sine", 0.16);
    tone(880, 0.11, "sine", 0.14, 0.09);
  },
  buy() {
    tone(392, 0.1, "triangle", 0.16);
    tone(587, 0.12, "triangle", 0.15, 0.1);
  },
  win() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.15, "triangle", 0.18, i * 0.12));
  },
  qahar() {
    tone(220, 0.26, "sawtooth", 0.16);
    tone(150, 0.32, "sawtooth", 0.14, 0.13);
  },
};

// إعلان نوع الشراء صوتياً
export function announceBid(mode, ashkal) {
  if (ashkal) return say("أشكل");
  if (mode === "sun") return say("صن");
  if (mode === "hokom") return say("حكم");
}
