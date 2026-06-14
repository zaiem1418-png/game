// عارضات الوسائط للهدايا غير المدمجة: Lottie / Rive / Video / GIF.
// تُحمّل مكتبات Lottie و Rive من CDN عند الحاجة فقط (بدون تضخيم الحزمة أو كسر البناء).
// كلها تعرض ملء الشاشة فوق الغرفة، والتوقيت يديره GiftStage (لا حاجة لـ onDone هنا).

import { useEffect, useRef } from "react";

// تحميل سكربت خارجي مرة واحدة (مع تخزين الوعد)
const scriptCache = new Map();
function loadScript(src, globalKey) {
  if (window[globalKey]) return Promise.resolve(window[globalKey]);
  if (scriptCache.has(src)) return scriptCache.get(src);
  const p = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve(window[globalKey]);
    s.onerror = () => reject(new Error("فشل تحميل " + src));
    document.head.appendChild(s);
  });
  scriptCache.set(src, p);
  return p;
}

const LOTTIE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js";
const RIVE_CDN = "https://unpkg.com/@rive-app/canvas@2.21.6/rive.js";

// ── Lottie ──────────────────────────────────────────────
export function LottieRenderer({ gift }) {
  const box = useRef(null);
  useEffect(() => {
    let anim = null,
      dead = false;
    loadScript(LOTTIE_CDN, "lottie")
      .then((lottie) => {
        if (dead || !box.current || !lottie) return;
        anim = lottie.loadAnimation({
          container: box.current,
          renderer: "svg",
          loop: !!gift.loopAsset,
          autoplay: true,
          path: gift.asset,
        });
      })
      .catch((e) => console.warn(e.message));
    return () => {
      dead = true;
      anim?.destroy();
    };
  }, [gift.asset, gift.loopAsset]);

  return <div ref={box} className="gx-media gx-lottie" />;
}

// ── Rive ────────────────────────────────────────────────
export function RiveRenderer({ gift }) {
  const canvas = useRef(null);
  useEffect(() => {
    let r = null,
      dead = false;
    loadScript(RIVE_CDN, "rive")
      .then((rive) => {
        if (dead || !canvas.current || !rive) return;
        r = new rive.Rive({
          src: gift.asset,
          canvas: canvas.current,
          autoplay: true,
          layout: new rive.Layout({ fit: rive.Fit.Contain, alignment: rive.Alignment.Center }),
          onLoad: () => r.resizeDrawingSurfaceToCanvas(),
        });
      })
      .catch((e) => console.warn(e.message));
    return () => {
      dead = true;
      try {
        r?.cleanup();
      } catch {}
    };
  }, [gift.asset]);

  return <canvas ref={canvas} className="gx-media gx-rive" />;
}

// ── Video (MP4/WebM) ────────────────────────────────────
export function VideoRenderer({ gift }) {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.volume = gift.volume ?? 0.8;
    // جرّب التشغيل بالصوت؛ إن رفض المتصفح، أعد المحاولة كتم الصوت
    v.play().catch(() => {
      v.muted = true;
      v.play().catch(() => {});
    });
  }, [gift.asset, gift.volume]);

  return (
    <video
      ref={ref}
      className="gx-media gx-video"
      src={gift.asset}
      autoPlay
      playsInline
      loop={!!gift.loopAsset}
      preload="auto"
    />
  );
}

// ── GIF ─────────────────────────────────────────────────
export function GifRenderer({ gift }) {
  // مفتاح فريد يجبر إعادة تحميل الـGIF من البداية في كل عرض
  return <img className="gx-media gx-gif" src={gift.asset} alt={gift.name} />;
}

export function MediaRenderer({ gift }) {
  switch (gift.renderer) {
    case "lottie":
      return <LottieRenderer gift={gift} />;
    case "rive":
      return <RiveRenderer gift={gift} />;
    case "video":
      return <VideoRenderer gift={gift} />;
    case "gif":
      return <GifRenderer gift={gift} />;
    default:
      return null;
  }
}
