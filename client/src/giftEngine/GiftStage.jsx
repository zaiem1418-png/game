// مسرح الهدايا — طبقة ملء الشاشة فوق الغرفة بالكامل.
// يدير: الطابور والأولوية، حلقة رسم 60FPS، الجسيمات، الإضاءة، الومضات، الاهتزاز،
// لافتة المرسِل←المستلم مع شارة الندرة وعدّاد الـcombo، وعرض هدايا الوسائط (Lottie/Rive/Video/GIF).

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { GiftQueue } from "./core/GiftQueue.js";
import { ParticleSystem } from "./core/ParticleSystem.js";
import { getScenario } from "./scenarios.js";
import { playSound, unlockAudio } from "./core/SoundManager.js";
import { lerp, phase, clamp01 } from "./core/easing.js";
import { Easing } from "./core/easing.js";
import { MediaRenderer } from "./renderers/MediaRenderers.jsx";

const RARITY = {
  common: { label: "عادية", color: "#9fb0c9" },
  rare: { label: "نادرة", color: "#4aa3ff" },
  epic: { label: "ملحمية", color: "#b06bff" },
  legendary: { label: "أسطورية", color: "#ffc24a" },
};

const BACKGROUNDS = {
  speed: "radial-gradient(1200px 600px at 50% 60%, #2a2030, #0c0810 80%)",
  sky: "linear-gradient(#7ec8ff, #cdeeff 60%, #eafaff)",
  night: "radial-gradient(1200px 800px at 50% 30%, #1c2452, #05060f 85%)",
  gold: "radial-gradient(1000px 700px at 50% 30%, #4a3a12, #120c04 85%)",
  space: "radial-gradient(1200px 900px at 50% 40%, #25104a, #03030a 85%)",
};

const GiftStage = forwardRef(function GiftStage(_props, ref) {
  const [playing, setPlaying] = useState(null); // الـpayload الجاري عرضه
  const [combo, setCombo] = useState(1);
  const [queueLen, setQueueLen] = useState(0);

  const canvasRef = useRef(null);
  const heroRef = useRef(null);
  const stageRef = useRef(null);
  const textRef = useRef(null);
  const bgRef = useRef(null);

  const psRef = useRef(new ParticleSystem());
  const queueRef = useRef(null);
  const rafRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const playStateRef = useRef(null); // { payload, scenario, start, once:Set, flashA, flashColor, vignette }

  // إنشاء الطابور مرة واحدة
  if (!queueRef.current) {
    queueRef.current = new GiftQueue({
      onPlay: (payload) => startPlay(payload),
      onUpdate: (snap) => {
        setQueueLen(snap.length);
        if (snap.current) setCombo(snap.current.combo || 1);
      },
    });
  }

  // واجهة الإضافة الخارجية (يناديها App عند وصول هدية)
  useImperativeHandle(ref, () => ({
    enqueue(payload) {
      unlockAudio();
      queueRef.current.enqueue(payload);
    },
    clear() {
      queueRef.current.clear();
    },
  }));

  // ضبط حجم الكانفاس مع دعم DPR (محدود بـ2 للأداء)
  function resize() {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth,
      h = window.innerHeight;
    c.width = w * dpr;
    c.height = h * dpr;
    c.style.width = w + "px";
    c.style.height = h + "px";
    sizeRef.current = { w, h, dpr };
    psRef.current.resize(w, h);
  }

  useEffect(() => {
    resize();
    window.addEventListener("resize", resize);
    const onVis = () => {
      // إيقاف الحلقة عند إخفاء التبويب (توفير طاقة الموبايل)
      if (document.hidden) cancelAnimationFrame(rafRef.current);
      else if (playStateRef.current) loop(performance.now());
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function startPlay(payload) {
    const gift = payload.gift;
    setPlaying(payload);
    setCombo(payload.combo || 1);
    psRef.current.clear();

    const st = {
      payload,
      gift,
      scenario: gift.renderer === "scenario" ? getScenario(gift.scenario) : null,
      duration: gift.duration || 4000,
      start: performance.now(),
      once: new Set(),
      flashA: 0,
      flashColor: "#ffffff",
      vignette: 0,
      shake: 0,
    };
    playStateRef.current = st;

    // خلفية المشهد
    if (bgRef.current) bgRef.current.style.background = "transparent";

    // صوت افتتاحي لهدايا الوسائط (السيناريوهات تشغّل صوتها بنفسها داخلياً)
    if (gift.renderer !== "scenario" && gift.sound) {
      playSound(gift.sound, gift.volume ?? 0.8);
    }

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
  }

  function finishPlay() {
    cancelAnimationFrame(rafRef.current);
    playStateRef.current = null;
    setPlaying(null);
    psRef.current.clear();
    // نظّف المسرح
    if (stageRef.current) stageRef.current.style.transform = "";
    if (textRef.current) textRef.current.textContent = "";
    if (bgRef.current) bgRef.current.style.background = "transparent";
    queueRef.current.next();
  }

  function buildApi(st, t) {
    const { w: W, h: H } = sizeRef.current;
    const ps = psRef.current;
    let hero = null;
    let beam = null;
    let bgName = null;
    let textVal = "";
    let textStyle = null;

    const api = {
      W, H,
      E: Easing,
      lerp,
      phase,
      px: (nx, ny) => [nx * W, ny * H],
      hero: (p) => {
        hero = p;
      },
      emit: (type, x, y, n, opts) => ps.emit(type, x, y, n, opts),
      flash: (color, a) => {
        st.flashColor = color || "#ffffff";
        st.flashA = Math.max(st.flashA, a == null ? 0.5 : a);
      },
      shake: (amount) => {
        st.shake = Math.max(st.shake, amount);
      },
      vignette: (a) => {
        st.vignette = a;
      },
      bg: (name) => {
        bgName = name;
      },
      beam: (x, y, a) => {
        beam = { x, y, a };
      },
      text: (str, style) => {
        textVal = str;
        textStyle = style;
      },
      once: (key, fn) => {
        if (!st.once.has(key)) {
          st.once.add(key);
          fn();
        }
      },
      sound: (id, vol = 1) => playSound(id, clamp01(vol * (st.gift.volume ?? 0.8))),
    };
    return { api, get: () => ({ hero, beam, bgName, textVal, textStyle }) };
  }

  function loop(now) {
    const st = playStateRef.current;
    if (!st) return;
    const t = clamp01((now - st.start) / st.duration);
    const { w: W, h: H, dpr } = sizeRef.current;
    const ctx = canvasRef.current.getContext("2d");

    st.shake = 0;
    let frameOut = { hero: null, beam: null, bgName: null, textVal: "", textStyle: null };

    if (st.scenario) {
      const built = buildApi(st, t);
      st.scenario(built.api, t);
      frameOut = built.get();
    }

    // ── الرسم ──
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // خلفية المشهد (DOM)
    if (frameOut.bgName && bgRef.current && BACKGROUNDS[frameOut.bgName]) {
      const target = BACKGROUNDS[frameOut.bgName];
      if (bgRef.current._bg !== target) {
        bgRef.current.style.background = target;
        bgRef.current._bg = target;
      }
    }

    // شعاع إضاءة خلف البطل
    if (frameOut.beam) {
      const { x, y, a } = frameOut.beam;
      const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(W, H) * 0.5);
      g.addColorStop(0, `rgba(255,240,200,${0.4 * a})`);
      g.addColorStop(1, "rgba(255,240,200,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // الجسيمات
    const ps = psRef.current;
    ps.update();
    ps.render(ctx);

    // البطل (DOM emoji) — نطبّق التحويل مباشرة لتفادي إعادة رسم React
    if (heroRef.current) {
      if (frameOut.hero) {
        const h = frameOut.hero;
        const sx = h.scaleX == null ? 1 : h.scaleX;
        const sy = h.scaleY == null ? 1 : h.scaleY;
        const s = h.scale == null ? 1 : h.scale;
        heroRef.current.style.opacity = h.opacity == null ? 1 : h.opacity;
        heroRef.current.style.filter =
          (h.blur ? `blur(${h.blur}px) ` : "") +
          (h.glow ? `drop-shadow(0 0 ${20 * h.glow}px rgba(255,220,150,${0.9 * h.glow}))` : "");
        heroRef.current.style.transform =
          `translate(${h.x}px, ${h.y}px) translate(-50%, -50%) ` +
          `rotate(${h.rot || 0}rad) scale(${s * sx}, ${s * sy})`;
        heroRef.current.style.visibility = "visible";
      } else {
        heroRef.current.style.visibility = "hidden";
      }
    }

    // نص (عدّ تنازلي)
    if (textRef.current) {
      if (frameOut.textVal) {
        textRef.current.textContent = frameOut.textVal;
        const fs = (frameOut.textStyle?.size || 0.2) * Math.min(W, H);
        textRef.current.style.fontSize = fs + "px";
        textRef.current.style.color = frameOut.textStyle?.color || "#fff";
        textRef.current.style.opacity = 1;
      } else {
        textRef.current.style.opacity = 0;
      }
    }

    // ومضة كامل الشاشة (تتلاشى)
    if (st.flashA > 0.01) {
      ctx.fillStyle = st.flashColor;
      ctx.globalAlpha = clamp01(st.flashA);
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
      st.flashA *= 0.86;
    }

    // تعتيم الحواف
    if (st.vignette > 0.01) {
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, `rgba(0,0,0,${st.vignette})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // اهتزاز الشاشة
    if (st.shake > 0.1 && stageRef.current) {
      const dx = (Math.random() - 0.5) * st.shake * 2;
      const dy = (Math.random() - 0.5) * st.shake * 2;
      stageRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
    } else if (stageRef.current) {
      stageRef.current.style.transform = "";
    }

    if (t >= 1) {
      finishPlay();
      return;
    }
    rafRef.current = requestAnimationFrame(loop);
  }

  if (!playing) return null;

  const gift = playing.gift;
  const rar = RARITY[gift.rarity] || RARITY.common;
  const isMedia = gift.renderer !== "scenario";

  return (
    <div className="gx-stage" ref={stageRef}>
      <div className="gx-bg" ref={bgRef} />

      {/* البطل: سيناريو emoji */}
      {!isMedia && (
        <div className="gx-hero" ref={heroRef}>
          {gift.emoji}
        </div>
      )}

      {/* هدايا الوسائط */}
      {isMedia && (
        <div className="gx-media-wrap">
          <MediaRenderer key={playing.id} gift={gift} />
        </div>
      )}

      {/* كانفاس الجسيمات/الإضاءة فوق البطل */}
      <canvas className="gx-canvas" ref={canvasRef} />

      {/* نص العدّ التنازلي */}
      <div className="gx-bigtext" ref={textRef} />

      {/* لافتة المرسِل ← المستلم + شارة الندرة + combo */}
      <div className="gx-banner">
        <span className="gx-rarity" style={{ background: rar.color }}>
          {rar.label}
        </span>
        <span className="gx-emoji-sm">{gift.emoji}</span>
        <span className="gx-names">
          <b>{playing.from?.name || "؟"}</b>
          {playing.to ? (
            <>
              {" "}
              <span className="gx-arrow">→</span> <b>{playing.to.name}</b>
            </>
          ) : (
            <span className="gx-arrow"> 🌍 للجميع</span>
          )}
        </span>
        {combo > 1 && <span className="gx-combo">×{combo}</span>}
      </div>

      {/* مؤشر بقية الطابور */}
      {queueLen > 0 && <div className="gx-queue">+{queueLen} هدية في الانتظار</div>}
    </div>
  );
});

export default GiftStage;
