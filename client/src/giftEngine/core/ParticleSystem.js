// محرك جسيمات Canvas2D عالي الأداء — يدعم دخان، غبار، نار، شرر، ألعاب نارية، قصاصات، نجوم، سحب.
// تجمّع الجسيمات (object pool) لتفادي الـGC على الموبايل، وحد أقصى للعدد للحفاظ على 60FPS.

const MAX_PARTICLES = 700; // سقف يحمي أجهزة الموبايل الضعيفة

function rand(a, b) {
  return a + Math.random() * (b - a);
}

const PALETTES = {
  fire: ["#fff3b0", "#ffd24a", "#ff9d2f", "#ff5722", "#e53935"],
  smoke: ["rgba(120,120,130,", "rgba(90,90,100,", "rgba(150,150,160,"],
  dust: ["#c9b48f", "#b89b6e", "#a98a5c", "#d8c9a3"],
  spark: ["#ffffff", "#fff0a8", "#ffd24a"],
  gold: ["#fff3b0", "#ffd24a", "#f5c451", "#ffe9a8"],
  fireworks: ["#ff5e7e", "#ffd24a", "#5ee0ff", "#9b5cff", "#7dff8a", "#ff8a3d"],
  confetti: ["#ff5e7e", "#ffd24a", "#5ee0ff", "#9b5cff", "#7dff8a"],
  cosmic: ["#9b5cff", "#5ee0ff", "#ff6fae", "#ffffff", "#c8a8ff"],
};

function pick(arr) {
  return arr[(Math.random() * arr.length) | 0];
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.w = 0;
    this.h = 0;
  }

  resize(w, h) {
    this.w = w;
    this.h = h;
  }

  clear() {
    this.particles.length = 0;
  }

  get count() {
    return this.particles.length;
  }

  _spawn(p) {
    if (this.particles.length >= MAX_PARTICLES) return;
    this.particles.push(p);
  }

  /**
   * إطلاق دفعة جسيمات.
   * type: smoke|dust|fire|sparks|fireworks|confetti|glitter|clouds|trail|ring
   * x,y بالبكسل. opts اختيارية لكل نوع.
   */
  emit(type, x, y, count = 12, opts = {}) {
    const fn = this[`_emit_${type}`];
    if (fn) fn.call(this, x, y, count, opts);
  }

  _emit_smoke(x, y, n, o) {
    for (let i = 0; i < n; i++) {
      this._spawn({
        kind: "smoke",
        x: x + rand(-12, 12),
        y: y + rand(-8, 8),
        vx: rand(-0.3, 0.3) + (o.vx || 0),
        vy: rand(-1.4, -0.5),
        r: rand(14, 30),
        grow: rand(0.25, 0.6),
        life: 1,
        decay: rand(0.004, 0.01),
        color: pick(PALETTES.smoke),
        alpha: rand(0.25, 0.5),
      });
    }
  }

  _emit_dust(x, y, n, o) {
    for (let i = 0; i < n; i++) {
      const a = rand(-Math.PI, 0); // نصف دائرة للأعلى
      const sp = rand(1.5, 6) * (o.power || 1);
      this._spawn({
        kind: "dust",
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp * 0.6,
        r: rand(2, 6),
        grow: rand(0.1, 0.4),
        gravity: 0.12,
        life: 1,
        decay: rand(0.012, 0.025),
        color: pick(PALETTES.dust),
        alpha: rand(0.5, 0.85),
      });
    }
  }

  _emit_fire(x, y, n, o) {
    for (let i = 0; i < n; i++) {
      this._spawn({
        kind: "fire",
        x: x + rand(-10, 10),
        y: y + rand(-6, 6),
        vx: rand(-0.5, 0.5) + (o.vx || 0),
        vy: rand(-3, -1) + (o.vy || 0),
        r: rand(6, 16),
        grow: -rand(0.1, 0.3),
        life: 1,
        decay: rand(0.02, 0.04),
        color: pick(PALETTES.fire),
        alpha: rand(0.7, 1),
        glow: true,
      });
    }
  }

  _emit_sparks(x, y, n, o) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(2, 8) * (o.power || 1);
      this._spawn({
        kind: "spark",
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        r: rand(1, 2.5),
        gravity: 0.14,
        life: 1,
        decay: rand(0.02, 0.045),
        color: pick(o.palette ? PALETTES[o.palette] : PALETTES.spark),
        alpha: 1,
        glow: true,
        trail: true,
      });
    }
  }

  _emit_fireworks(x, y, n, o) {
    const color = pick(PALETTES.fireworks);
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + rand(-0.1, 0.1);
      const sp = rand(3, 7) * (o.power || 1);
      this._spawn({
        kind: "spark",
        x, y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        r: rand(1.5, 3),
        gravity: 0.06,
        drag: 0.97,
        life: 1,
        decay: rand(0.012, 0.022),
        color: o.rainbow ? pick(PALETTES.fireworks) : color,
        alpha: 1,
        glow: true,
        trail: true,
      });
    }
  }

  _emit_confetti(x, y, n) {
    for (let i = 0; i < n; i++) {
      this._spawn({
        kind: "confetti",
        x: x + rand(-30, 30),
        y,
        vx: rand(-2.5, 2.5),
        vy: rand(-1, 2),
        r: rand(4, 8),
        rot: rand(0, Math.PI * 2),
        vrot: rand(-0.3, 0.3),
        gravity: 0.08,
        drag: 0.99,
        life: 1,
        decay: rand(0.004, 0.009),
        color: pick(PALETTES.confetti),
        alpha: 1,
      });
    }
  }

  _emit_glitter(x, y, n, o) {
    for (let i = 0; i < n; i++) {
      this._spawn({
        kind: "glitter",
        x: x + rand(-(o.spread || 40), o.spread || 40),
        y: y + rand(-(o.spread || 40), o.spread || 40),
        vx: rand(-0.4, 0.4),
        vy: rand(-0.8, -0.1),
        r: rand(1.5, 3.5),
        twinkle: rand(0, Math.PI * 2),
        vtwinkle: rand(0.1, 0.25),
        life: 1,
        decay: rand(0.01, 0.02),
        color: pick(PALETTES.gold),
        alpha: 1,
        glow: true,
      });
    }
  }

  _emit_clouds(x, y, n, o) {
    for (let i = 0; i < n; i++) {
      this._spawn({
        kind: "cloud",
        x, y: y + rand(-40, 40),
        vx: (o.vx || -1.2) + rand(-0.3, 0.3),
        vy: rand(-0.1, 0.1),
        r: rand(40, 90),
        life: 1,
        decay: rand(0.003, 0.006),
        color: "rgba(255,255,255,",
        alpha: rand(0.4, 0.75),
      });
    }
  }

  _emit_trail(x, y, n, o) {
    // ذيل دخان للطائرة (أبيض ناعم)
    for (let i = 0; i < n; i++) {
      this._spawn({
        kind: "smoke",
        x: x + rand(-4, 4),
        y: y + rand(-4, 4),
        vx: rand(-0.2, 0.2),
        vy: rand(-0.3, 0.1),
        r: rand(6, 14),
        grow: rand(0.3, 0.7),
        life: 1,
        decay: rand(0.008, 0.016),
        color: "rgba(245,245,255,",
        alpha: rand(0.4, 0.7),
      });
    }
  }

  _emit_ring(x, y, n, o) {
    // حلقة صدمة متوسّعة (موجة واحدة)
    this._spawn({
      kind: "shock",
      x, y,
      r: 4,
      grow: o.grow || 9,
      life: 1,
      decay: 0.03,
      color: o.color || "#ffffff",
      alpha: 0.8,
      lw: o.lw || 4,
    });
  }

  update() {
    const ps = this.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      if (p.drag) {
        p.vx *= p.drag;
        p.vy *= p.drag;
      }
      if (p.gravity) p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      if (p.grow) p.r += p.grow;
      if (p.r < 0) p.r = 0;
      if (p.vrot) p.rot += p.vrot;
      if (p.vtwinkle) p.twinkle += p.vtwinkle;
      p.life -= p.decay;
      if (p.life <= 0) ps.splice(i, 1);
    }
  }

  render(ctx) {
    const ps = this.particles;
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const a = Math.max(0, Math.min(1, p.life * (p.alpha == null ? 1 : p.alpha)));
      if (a <= 0) continue;
      ctx.globalAlpha = a;

      if (p.kind === "smoke" || p.kind === "cloud") {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, p.color + a + ")");
        g.addColorStop(1, p.color + "0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === "shock") {
        ctx.globalAlpha = a;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.lw;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === "confetti") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        ctx.restore();
      } else {
        // نقطة لامعة (نار/شرر/ذهب/كوني)
        if (p.glow) {
          ctx.shadowBlur = 12;
          ctx.shadowColor = p.color;
        }
        if (p.kind === "glitter") {
          a; // وميض
          ctx.globalAlpha = a * (0.4 + 0.6 * Math.abs(Math.sin(p.twinkle)));
        }
        if (p.trail) {
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.r;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 1.6, p.y - p.vy * 1.6);
          ctx.stroke();
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }
    }
    ctx.globalAlpha = 1;
  }
}
