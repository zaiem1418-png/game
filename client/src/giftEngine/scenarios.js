// مكتبة سيناريوهات الهدايا — كل هدية لها "إخراج" سينمائي خاص (مسار حركة + جسيمات + إضاءة + صوت).
// كل سيناريو دالة update(api, t) تُستدعى كل إطار (t من 0 إلى 1 على مدى مدة الهدية).
//
// واجهة api المتاحة:
//   api.W, api.H            أبعاد المسرح بالبكسل
//   api.px(nx, ny)          تحويل إحداثيات منسوبة (0..1) إلى بكسل → [x,y]
//   api.hero({x,y,scale,rot,opacity,blur,glow})   تموضع/تحجيم سبرايت الهدية
//   api.emit(type,x,y,n,opts)   إطلاق جسيمات
//   api.flash(color, a)     ومضة شاشة
//   api.shake(amount)       اهتزاز هذا الإطار (px)
//   api.vignette(a)         تعتيم الحواف
//   api.bg(name)            خلفية المشهد
//   api.text(str, opts)     نص كبير (عدّ تنازلي مثلاً)
//   api.beam(x,y,a)         شعاع إضاءة من نقطة
//   api.once(key, fn)       تنفيذ مرة واحدة (للصوت/التأثيرات اللحظية)
//   api.sound(id, vol)      تشغيل صوت مرة واحدة
//   api.E                   دوال التيسير، api.lerp, api.phase

import { Easing, lerp, phase, clamp01 } from "./core/easing.js";

const E = Easing;

// مساعد: إطلاق مستمر ضمن نافذة زمنية
function within(t, a, b) {
  return t >= a && t <= b;
}

export const SCENARIOS = {
  // ── افتراضي لأي هدية جديدة: صعود + لمعان ────────────────
  default(api, t) {
    const [cx] = api.px(0.5, 0);
    const y = lerp(api.H * 0.9, api.H * 0.4, E.easeOutCubic(t));
    const scale = lerp(0.2, 1.1, E.easeOutBack(clamp01(t * 1.6)));
    const opacity = t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1;
    api.hero({ x: cx, y, scale, opacity, glow: 0.6 });
    api.once("s", () => api.sound("chime", 0.6));
    if (within(t, 0.2, 0.9)) api.emit("glitter", cx, y, 3, { spread: 70 });
  },

  // ── وردة/قبلة: تطفو لأعلى بنعومة ───────────────────────
  floatUp(api, t) {
    const [cx] = api.px(0.5, 0);
    const sway = Math.sin(t * Math.PI * 3) * api.W * 0.04;
    const y = lerp(api.H * 0.85, api.H * 0.25, E.easeOutCubic(t));
    const opacity = t > 0.75 ? 1 - (t - 0.75) / 0.25 : Math.min(1, t * 4);
    api.hero({ x: cx + sway, y, scale: lerp(0.6, 1, E.easeOutBack(clamp01(t * 2))), opacity, rot: sway * 0.002 });
    if (within(t, 0.1, 0.8)) api.emit("glitter", cx + sway, y + 20, 2, { spread: 30 });
  },

  // ── قلب: ينبض ثم ينفجر قلوباً ───────────────────────────
  heartBurst(api, t) {
    const [cx, cy] = api.px(0.5, 0.42);
    const pulse = 1 + Math.sin(t * Math.PI * 6) * 0.12;
    const scale = lerp(0.3, 1.2, E.easeOutBack(clamp01(t * 2))) * pulse;
    const opacity = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
    api.hero({ x: cx, y: cy, scale, opacity, glow: 0.7 });
    api.once("s", () => api.sound("chime", 0.6));
    if (within(t, 0.5, 0.75)) {
      api.once("burst", () => api.emit("sparks", cx, cy, 24, { palette: "fireworks", power: 0.8 }));
    }
  },

  // ── تصفيق/نخب: نجوم تتطاير ──────────────────────────────
  popStars(api, t) {
    const [cx, cy] = api.px(0.5, 0.42);
    const scale = lerp(0.3, 1.1, E.easeOutBack(clamp01(t * 2)));
    const opacity = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
    api.hero({ x: cx, y: cy, scale, opacity });
    api.once("s", () => api.sound("pop", 0.5));
    if (within(t, 0.15, 0.7)) api.emit("confetti", cx, cy - 40, 4);
  },

  // ── تاج: ينزل من الأعلى بفخامة مع نشيد ─────────────────
  crown(api, t) {
    api.bg("gold");
    const [cx] = api.px(0.5, 0);
    const y = lerp(-api.H * 0.2, api.H * 0.42, E.easeOutBounce(t));
    const scale = lerp(0.6, 1.3, E.easeOutCubic(clamp01(t * 1.4)));
    api.hero({ x: cx, y, scale, glow: 0.9, rot: Math.sin(t * Math.PI * 4) * 0.05 });
    api.once("s", () => api.sound("fanfare", 0.7));
    api.beam(cx, y, 0.5 + 0.3 * Math.sin(t * Math.PI * 6));
    if (within(t, 0.3, 0.95)) api.emit("glitter", cx, y, 4, { spread: 100 });
    if (t > 0.55) api.once("ring", () => api.emit("ring", cx, y, 1, { color: "#f5c451", grow: 12 }));
  },

  // ── ألماسة/خاتم: تظهر من المركز، تدور 3D، تنفجر شرراً ──
  diamond(api, t) {
    api.bg("night");
    const [cx, cy] = api.px(0.5, 0.42);
    const appear = E.easeOutBack(clamp01(t * 2.2));
    const scale = lerp(0.1, 1.2, appear) * (t > 0.78 ? lerp(1, 1.6, (t - 0.78) / 0.22) : 1);
    // محاكاة دوران 3D عبر تذبذب التحجيم الأفقي (scaleX) — نمرّره كـ rot + flip
    const spin = t * Math.PI * 6;
    const flip = Math.abs(Math.cos(spin)); // 0..1 لإيحاء العمق
    const opacity = t > 0.82 ? 1 - (t - 0.82) / 0.18 : 1;
    api.hero({ x: cx, y: cy, scale, opacity, glow: 0.6 + 0.4 * flip, scaleX: 0.25 + 0.75 * flip, rot: 0 });
    api.once("s", () => api.sound("sparkle", 0.8));
    // انعكاسات لمعان دورية
    if (within(t, 0.15, 0.78) && flip > 0.85) api.emit("glitter", cx, cy, 3, { spread: 60 });
    // الانفجار النهائي
    if (t > 0.8) {
      api.once("boom", () => {
        api.sound("sparkle", 0.9);
        api.flash("#bfefff", 0.7);
        api.emit("fireworks", cx, cy, 60, { power: 1.1, rainbow: true });
        api.emit("ring", cx, cy, 1, { color: "#bfefff", grow: 14 });
      });
    }
  },

  // ── عرض ألعاب نارية ────────────────────────────────────
  fireworksShow(api, t) {
    api.bg("night");
    const [cx, cy] = api.px(0.5, 0.4);
    const scale = lerp(0.2, 1, E.easeOutBack(clamp01(t * 2)));
    const opacity = t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1;
    api.hero({ x: cx, y: cy, scale, opacity, glow: 0.7 });
    api.once("s", () => api.sound("fireworks", 0.8));
    // انفجارات متتالية في مواقع مختلفة
    [0.15, 0.35, 0.55, 0.72].forEach((moment, i) => {
      if (t >= moment) {
        api.once("fw" + i, () => {
          const x = api.W * (0.2 + 0.15 * i + Math.random() * 0.15);
          const y = api.H * (0.2 + Math.random() * 0.25);
          api.emit("fireworks", x, y, 50, { power: 1, rainbow: true });
          api.flash("#ffffff", 0.25);
        });
      }
    });
  },

  // ── مطر نقود ────────────────────────────────────────────
  moneyRain(api, t) {
    const [cx, cy] = api.px(0.5, 0.4);
    const scale = lerp(0.3, 1, E.easeOutBack(clamp01(t * 2)));
    const opacity = t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1;
    api.hero({ x: cx, y: cy, scale, opacity, glow: 0.5 });
    api.once("s", () => api.sound("cash", 0.7));
    if (within(t, 0.1, 0.85)) {
      const x = Math.random() * api.W;
      api.emit("confetti", x, -10, 2);
      api.emit("glitter", x, Math.random() * api.H * 0.5, 1, { spread: 5 });
    }
  },

  // ══ صاروخ: عد تنازلي → انطلاق بنار ودخان → انفجار ألعاب نارية ══
  rocket(api, t) {
    api.bg("night");
    const [cx] = api.px(0.5, 0);
    // مرحلة 1: عدّ تنازلي (t < 0.3)
    if (t < 0.3) {
      const n = 3 - Math.floor((t / 0.3) * 3); // 3,2,1
      api.text(String(Math.max(1, n)), { size: 0.3, color: "#ffd24a" });
      api.hero({ x: cx, y: api.H * 0.7, scale: 1, glow: 0.3 + 0.3 * Math.sin(t * 30) });
      api.once("cd" + n, () => api.sound("countdown", 0.6));
      // دخان تمهيدي
      api.emit("smoke", cx, api.H * 0.78, 2);
      return;
    }
    // مرحلة 2: الانطلاق (0.3 → 0.75)
    api.once("launch", () => {
      api.sound("rocket", 0.9);
      api.shake(8);
    });
    const lp = phase(t, 0.3, 0.78);
    const y = lerp(api.H * 0.7, -api.H * 0.25, E.easeInCubic(lp));
    api.hero({ x: cx, y, scale: lerp(1, 0.7, lp), rot: Math.sin(t * 40) * 0.03, glow: 0.8 });
    api.shake(lerp(6, 1, lp));
    // نار ودخان من الذيل
    api.emit("fire", cx, y + 60, 6, { vy: 2 });
    api.emit("smoke", cx, y + 80, 3, { vx: 0 });
    // مرحلة 3: الانفجار في السماء (t > 0.78)
    if (t > 0.78) {
      api.once("explode", () => {
        api.sound("fireworks", 1);
        api.flash("#ffffff", 0.6);
        const ex = cx, ey = api.H * 0.22;
        for (let i = 0; i < 5; i++) {
          setTimeout(() => api.emit("fireworks", ex + (Math.random() - 0.5) * api.W * 0.4, ey + (Math.random() - 0.5) * api.H * 0.2, 50, { rainbow: true, power: 1.1 }), i * 180);
        }
      });
      api.hero({ x: cx, y: -api.H, scale: 0, opacity: 0 });
    }
  },

  // ══ طائرة خاصة: تعبر السماء مع ذيل دخان وسحب متحركة ══
  plane(api, t) {
    api.bg("sky");
    // تعبر من اليسار إلى اليمين بقوس خفيف
    const x = lerp(-api.W * 0.25, api.W * 1.25, E.easeInOutQuad(t));
    const y = api.H * 0.35 + Math.sin(t * Math.PI) * -api.H * 0.08;
    const opacity = clamp01(Math.min(t * 6, (1 - t) * 6));
    api.hero({ x, y, scale: 1.1, opacity, rot: 0.05 });
    api.once("s", () => api.sound("jet", 0.8));
    // ذيل دخان أبيض خلف الطائرة
    if (within(t, 0.06, 0.94)) api.emit("trail", x - 70, y + 14, 3);
    // سحب متحركة تمرّ
    if (within(t, 0, 0.95) && Math.random() < 0.25) {
      api.emit("clouds", api.W + 60, api.H * (0.2 + Math.random() * 0.5), 1, { vx: -2.5 });
    }
  },

  // ══ سيارة رياضية: تندفع داخلة، دخان إطارات، توقف بفلاش وإضاءة ══
  sportscar(api, t) {
    api.bg("speed");
    const roadY = api.H * 0.64;
    let x;
    if (t < 0.5) {
      // اندفاع من اليمين إلى المنتصف مع تباطؤ (screech)
      x = lerp(api.W * 1.3, api.W * 0.5, E.easeOutCubic(phase(t, 0, 0.5)));
      api.shake(lerp(5, 0, phase(t, 0.35, 0.5)));
      // دخان الإطارات أثناء الاندفاع
      api.emit("smoke", x + 60, roadY + 30, 3, { vx: 1.5 });
      api.once("s", () => api.sound("engine", 0.9));
    } else if (t < 0.78) {
      // توقّف وعرض — فلاش وإضاءة قوية عند لحظة التوقف
      x = api.W * 0.5;
      api.once("stop", () => {
        api.flash("#ffffff", 0.7);
        api.emit("ring", x, roadY, 1, { color: "#ffffff", grow: 16, lw: 6 });
        api.emit("sparks", x, roadY, 20, { power: 0.8 });
      });
      api.beam(x, roadY - 60, 0.4 + 0.2 * Math.sin(t * 20));
      if (Math.random() < 0.3) api.emit("smoke", x + 50, roadY + 25, 1);
    } else {
      // تنطلق خارجة من اليسار
      x = lerp(api.W * 0.5, -api.W * 0.4, E.easeInCubic(phase(t, 0.78, 1)));
      api.emit("smoke", x + 60, roadY + 30, 2, { vx: 1.5 });
    }
    const opacity = t > 0.92 ? 1 - (t - 0.92) / 0.08 : 1;
    api.hero({ x, y: roadY, scale: 1.2, opacity, glow: t > 0.5 && t < 0.78 ? 0.7 : 0.2 });
  },

  // ══ أسد: يقفز للمنتصف، زئير، اهتزاز، غبار عند الهبوط ══
  lion(api, t) {
    api.bg("night");
    const [cx] = api.px(0.5, 0);
    const groundY = api.H * 0.55;
    if (t < 0.4) {
      // قفزة بقوس من خارج اليسار إلى المنتصف
      const jp = phase(t, 0, 0.4);
      const x = lerp(-api.W * 0.2, cx, jp);
      const arc = Math.sin(jp * Math.PI) * api.H * 0.3;
      api.hero({ x, y: groundY - arc, scale: lerp(0.7, 1.3, jp), rot: lerp(-0.2, 0, jp) });
      api.once("jump", () => api.sound("whoosh", 0.5));
    } else {
      // الهبوط: غبار + اهتزاز + زئير
      api.once("land", () => {
        api.sound("roar", 0.95);
        api.shake(12);
        api.emit("dust", cx, groundY + 50, 40, { power: 1.4 });
        api.emit("ring", cx, groundY + 50, 1, { color: "#c9b48f", grow: 14, lw: 5 });
      });
      api.shake(lerp(10, 0, phase(t, 0.4, 0.6)));
      // زئير: اهتزاز السبرايت + توهج
      const roar = within(t, 0.42, 0.72) ? 1 + Math.sin(t * 50) * 0.05 : 1;
      const opacity = t > 0.88 ? 1 - (t - 0.88) / 0.12 : 1;
      api.hero({ x: cx, y: groundY, scale: 1.4 * roar, opacity, glow: 0.5 });
      if (within(t, 0.4, 0.55)) api.emit("dust", cx, groundY + 50, 4);
    }
  },

  // ══ قصر: يُبنى تدريجياً بلمعان ذهبي ثم يدور ببطء ══
  castle(api, t) {
    api.bg("gold");
    const [cx, cy] = api.px(0.5, 0.45);
    // البناء: يرتفع من الأرض مع قص من الأسفل (نحاكيه بالتحجيم العمودي scaleY)
    const build = E.easeOutCubic(clamp01(t / 0.55));
    const scaleY = build;
    const scale = lerp(0.7, 1.25, clamp01(t / 0.55));
    // بعد الاكتمال: دوران بطيء
    const rot = t > 0.55 ? (t - 0.55) * Math.PI * 0.6 : 0;
    api.hero({ x: cx, y: cy, scale, scaleY: lerp(0.2, 1, scaleY), rot: Math.sin(rot) * 0.15, glow: 0.7 });
    api.once("s", () => api.sound("build", 0.85));
    // غبار/لمعان أثناء البناء
    if (within(t, 0.05, 0.55)) {
      api.emit("dust", cx + (Math.random() - 0.5) * 120, cy + 70, 2, { power: 0.6 });
      api.emit("glitter", cx + (Math.random() - 0.5) * 140, cy - build * 80 + 40, 2, { spread: 20 });
    }
    // لمعان ذهبي بعد الاكتمال
    if (t > 0.55) {
      api.beam(cx, cy, 0.3 + 0.2 * Math.sin(t * 10));
      if (Math.random() < 0.4) api.emit("glitter", cx + (Math.random() - 0.5) * 150, cy - 30, 2, { spread: 30 });
    }
    if (t > 0.55) api.once("done", () => api.sound("sparkle", 0.6));
  },

  // ══ تنين: يحلّق عبر الشاشة ينفث ناراً ══
  dragon(api, t) {
    api.bg("night");
    const x = lerp(-api.W * 0.3, api.W * 1.3, E.easeInOutCubic(t));
    const y = api.H * 0.4 + Math.sin(t * Math.PI * 2) * api.H * 0.12;
    const opacity = clamp01(Math.min(t * 6, (1 - t) * 6));
    api.hero({ x, y, scale: 1.3, opacity, rot: Math.cos(t * Math.PI * 2) * 0.1, glow: 0.6 });
    api.once("s", () => api.sound("roar", 0.95));
    if (within(t, 0.3, 0.7)) {
      api.emit("fire", x + 80, y, 6, { vx: 4, vy: 0 });
      api.shake(3);
    }
    if (within(t, 0.05, 0.95)) api.emit("smoke", x - 70, y, 2);
  },

  // ══ عنقاء: تصعد متوهجة بالنار ثم تتلاشى ببريق ══
  phoenix(api, t) {
    api.bg("night");
    const [cx] = api.px(0.5, 0);
    const y = lerp(api.H * 0.9, api.H * 0.25, E.easeOutCubic(t));
    const sway = Math.sin(t * Math.PI * 3) * api.W * 0.06;
    const opacity = t > 0.82 ? 1 - (t - 0.82) / 0.18 : clamp01(t * 4);
    api.hero({ x: cx + sway, y, scale: lerp(0.5, 1.4, E.easeOutCubic(t)), opacity, glow: 0.9 });
    api.once("s", () => api.sound("whoosh", 0.85));
    if (within(t, 0.05, 0.85)) {
      api.emit("fire", cx + sway, y + 40, 5, { vy: 1 });
      api.emit("glitter", cx + sway, y, 3, { spread: 80 });
    }
    if (t > 0.8) api.once("burst", () => { api.flash("#ffcaa0", 0.5); api.emit("fireworks", cx + sway, y, 50, { rainbow: true }); });
  },

  // ══ يخت فاخر: يبحر عبر الشاشة مع بوق ورذاذ ══
  yacht(api, t) {
    api.bg("sky");
    const x = lerp(-api.W * 0.3, api.W * 1.3, E.easeInOutQuad(t));
    const y = api.H * 0.62 + Math.sin(t * Math.PI * 4) * 10;
    const opacity = clamp01(Math.min(t * 6, (1 - t) * 6));
    api.hero({ x, y, scale: 1.25, opacity, rot: Math.sin(t * Math.PI * 4) * 0.04, glow: 0.4 });
    api.once("s", () => api.sound("horn", 0.85));
    if (within(t, 0.06, 0.94)) {
      api.emit("trail", x - 80, y + 20, 2);
      api.emit("glitter", x - 60, y + 30, 1, { spread: 20 });
    }
  },

  // ══ مجرّة: دوامة كونية تتوسّع وتلمع ══
  galaxy(api, t) {
    api.bg("space");
    const [cx, cy] = api.px(0.5, 0.42);
    const scale = lerp(0.2, 1.5, E.easeOutCubic(t));
    const opacity = t > 0.85 ? 1 - (t - 0.85) / 0.15 : 1;
    api.hero({ x: cx, y: cy, scale, opacity, rot: t * Math.PI * 3, glow: 0.8 });
    api.once("s", () => api.sound("cosmic", 0.9));
    // دوامة نجوم
    if (within(t, 0.1, 0.9)) {
      const ang = t * Math.PI * 8;
      const rad = t * api.W * 0.3;
      api.emit("glitter", cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad * 0.6, 3, { spread: 10 });
    }
    if (t > 0.8) api.once("flash", () => api.flash("#9b5cff", 0.4));
  },
};

// إرجاع دالة السيناريو حسب الاسم (مع fallback آمن)
export function getScenario(name) {
  return SCENARIOS[name] || SCENARIOS.default;
}
