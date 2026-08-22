// لوحة إدارة الهدايا — إضافة/تحرير/حذف هدايا دون تعديل الكود، مع معاينة حيّة للأنيميشن.
// الوصول: افتح التطبيق بالرابط ?admin — أدخل رمز الإدارة (افتراضي admin123، غيّره عبر ADMIN_TOKEN).

import { useEffect, useRef, useState } from "react";
import GiftStage from "../giftEngine/GiftStage.jsx";
import { BUILTIN_SOUNDS } from "../giftEngine/core/SoundManager.js";
import { SCENARIOS } from "../giftEngine/scenarios.js";
import { SERVER_URL } from "../serverUrl.js";
import { EyeIcon, EditIcon, TrashIcon } from "./ControlIcons.jsx";

const RARITIES = ["common", "rare", "epic", "legendary"];
const RENDERERS = ["scenario", "lottie", "rive", "video", "gif"];

const BLANK = {
  id: "",
  name: "",
  emoji: "🎁",
  coins: 10,
  rarity: "common",
  priority: 1,
  duration: 4000,
  renderer: "scenario",
  scenario: "default",
  asset: "",
  sound: "chime",
  volume: 0.8,
  shake: false,
  fullscreen: true,
  loopAsset: false,
};

export default function AdminPanel() {
  const [token, setToken] = useState(localStorage.getItem("giftAdminToken") || "");
  const [authed, setAuthed] = useState(false);
  const [gifts, setGifts] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState("");
  const stageRef = useRef(null);
  const assetInputRef = useRef(null);
  const soundInputRef = useRef(null);

  async function loadGifts() {
    const res = await fetch(`${SERVER_URL}/api/gifts`);
    setGifts(await res.json());
  }

  useEffect(() => {
    loadGifts().catch(() => setMsg("تعذّر الاتصال بالسيرفر"));
  }, []);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function edit(g) {
    setForm({ ...BLANK, ...g, asset: g.asset || "", scenario: g.scenario || "default" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    if (!form.id.trim()) return setMsg("⚠️ معرّف الهدية مطلوب (id)");
    const res = await fetch(`${SERVER_URL}/api/admin/gifts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": token },
      body: JSON.stringify(form),
    });
    if (res.status === 401) return setMsg("❌ رمز إدارة خاطئ");
    if (!res.ok) return setMsg("❌ " + (await res.json()).error);
    setMsg("✅ تم الحفظ");
    setForm(BLANK);
    loadGifts();
  }

  async function del(id) {
    if (!confirm(`حذف الهدية "${id}"؟`)) return;
    const res = await fetch(`${SERVER_URL}/api/admin/gifts/${id}`, {
      method: "DELETE",
      headers: { "x-admin-token": token },
    });
    if (res.status === 401) return setMsg("❌ رمز إدارة خاطئ");
    setMsg("🗑️ تم الحذف");
    loadGifts();
  }

  // استنتاج نوع العرض من امتداد الملف المرفوع
  function inferRenderer(ext) {
    return ext === ".json" ? "lottie" : ext === ".gif" ? "gif" : ext === ".riv" ? "rive" : "video";
  }

  // رفع ملف أصل (فيديو/Lottie/GIF إلى gifts، أو صوت إلى sounds) → يملأ الحقل تلقائياً
  async function uploadFile(kind, file) {
    if (!file) return;
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    const stem = (form.id.trim() || file.name.replace(/\.[^.]+$/, ""))
      .toLowerCase()
      .replace(/[^a-z0-9_.-]/g, "_");
    const fname = stem + ext;
    setUploading(kind);
    setMsg("⏳ جارٍ الرفع…");
    try {
      const res = await fetch(
        `${SERVER_URL}/api/admin/upload?kind=${kind}&name=${encodeURIComponent(fname)}`,
        {
          method: "POST",
          headers: { "x-admin-token": token, "Content-Type": file.type || "application/octet-stream" },
          body: file,
        }
      );
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) return setMsg("❌ رمز إدارة خاطئ");
      if (!res.ok) return setMsg("❌ " + (data.error || "فشل الرفع"));
      if (kind === "sounds") {
        // اربط الملف الحقيقي بحدث الصوت الأساسي للهدية (سيناريو يشغّله عبر api.sound)،
        // مع إبقاء معرّف الـsynth كبديل تلقائي إن تعذّر الملف.
        const isUrl = /^https?:|^\//.test(form.sound || "");
        const key = form.sound && !isUrl ? form.sound : "main";
        set("sounds", { ...(form.sounds || {}), [key]: data.url });
        setMsg(`✅ رُفع الصوت ورُبط بالحدث «${key}» — لا تنسَ حفظ الهدية`);
      } else {
        set("asset", data.url);
        if (form.renderer === "scenario") set("renderer", inferRenderer(ext));
        setMsg(`✅ رُفع الأنيميشن (${Math.round((data.bytes || 0) / 1024)}KB) — لا تنسَ حفظ الهدية`);
      }
    } catch (e) {
      setMsg("❌ " + e.message);
    } finally {
      setUploading("");
    }
  }

  function preview(g) {
    stageRef.current?.enqueue({
      id: "preview-" + Date.now(),
      gift: g,
      combo: 1,
      from: { id: "x", name: "معاينة" },
      to: { id: "y", name: "المستلم" },
      ts: Date.now(),
    });
  }

  function login() {
    localStorage.setItem("giftAdminToken", token);
    setAuthed(true);
  }

  if (!authed) {
    return (
      <div className="admin-login">
        <div className="admin-card">
          <h2>🔐 لوحة إدارة الهدايا</h2>
          <input
            type="password"
            placeholder="رمز الإدارة"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
          />
          <button onClick={login}>دخول</button>
          {msg && <p className="admin-msg">{msg}</p>}
        </div>
      </div>
    );
  }

  const scenarioNames = Object.keys(SCENARIOS);

  return (
    <div className="admin">
      <GiftStage ref={stageRef} />
      <h1>🎁 إدارة الهدايا ({gifts.length})</h1>
      {msg && <div className="admin-msg">{msg}</div>}

      <div className="admin-form">
        <h3>{gifts.some((g) => g.id === form.id) ? "تحرير هدية" : "هدية جديدة"}</h3>
        <div className="af-grid">
          <label>المعرّف (id)<input value={form.id} onChange={(e) => set("id", e.target.value)} placeholder="sportscar" /></label>
          <label>الاسم<input value={form.name} onChange={(e) => set("name", e.target.value)} /></label>
          <label>الإيموجي<input value={form.emoji} onChange={(e) => set("emoji", e.target.value)} /></label>
          <label>العملات<input type="number" value={form.coins} onChange={(e) => set("coins", +e.target.value)} /></label>

          <label>الندرة
            <select value={form.rarity} onChange={(e) => set("rarity", e.target.value)}>
              {RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label>الأولوية (1-10)<input type="number" min="1" max="10" value={form.priority} onChange={(e) => set("priority", +e.target.value)} /></label>
          <label>المدة (ms)<input type="number" value={form.duration} onChange={(e) => set("duration", +e.target.value)} /></label>

          <label>نوع العرض
            <select value={form.renderer} onChange={(e) => set("renderer", e.target.value)}>
              {RENDERERS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>

          {form.renderer === "scenario" ? (
            <label>السيناريو
              <select value={form.scenario} onChange={(e) => set("scenario", e.target.value)}>
                {scenarioNames.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          ) : (
            <label>رابط الملف (asset)<input value={form.asset} onChange={(e) => set("asset", e.target.value)} placeholder="https://.../gift.json أ/mp4/gif" /></label>
          )}

          <label>الصوت
            <input list="sounds" value={form.sound || ""} onChange={(e) => set("sound", e.target.value)} placeholder="معرّف أو رابط mp3" />
            <datalist id="sounds">{BUILTIN_SOUNDS.map((s) => <option key={s} value={s} />)}</datalist>
          </label>
          <label>مستوى الصوت (0-1)<input type="number" step="0.1" min="0" max="1" value={form.volume} onChange={(e) => set("volume", +e.target.value)} /></label>

          <label className="af-check"><input type="checkbox" checked={form.shake} onChange={(e) => set("shake", e.target.checked)} /> اهتزاز</label>
          <label className="af-check"><input type="checkbox" checked={form.fullscreen} onChange={(e) => set("fullscreen", e.target.checked)} /> ملء الشاشة</label>
          <label className="af-check"><input type="checkbox" checked={form.loopAsset} onChange={(e) => set("loopAsset", e.target.checked)} /> تكرار الوسيط</label>
        </div>
        <div className="af-uploads">
          <span className="af-up-label">📤 رفع أصول حقيقية:</span>
          <button
            type="button"
            className="btn-upload"
            disabled={!!uploading}
            onClick={() => assetInputRef.current?.click()}
          >
            {uploading === "gifts" ? "⏳ جارٍ الرفع…" : "🎬 أنيميشن (MP4/Lottie/GIF)"}
          </button>
          <input
            ref={assetInputRef}
            type="file"
            accept=".mp4,.webm,.json,.gif,.riv,video/*"
            hidden
            onChange={(e) => {
              uploadFile("gifts", e.target.files[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="btn-upload"
            disabled={!!uploading}
            onClick={() => soundInputRef.current?.click()}
          >
            {uploading === "sounds" ? "⏳ جارٍ الرفع…" : "🔊 صوت واقعي (MP3)"}
          </button>
          <input
            ref={soundInputRef}
            type="file"
            accept=".mp3,.wav,.ogg,.m4a,audio/*"
            hidden
            onChange={(e) => {
              uploadFile("sounds", e.target.files[0]);
              e.target.value = "";
            }}
          />
          {(form.asset || (form.sounds && Object.keys(form.sounds).length > 0)) && (
            <div className="af-up-status">
              {form.asset && <div>🎬 {form.asset}</div>}
              {form.sounds &&
                Object.entries(form.sounds).map(([k, v]) => (
                  <div key={k}>🔊 {k}: {v}</div>
                ))}
            </div>
          )}
        </div>

        <div className="af-actions">
          <button className="btn-save" onClick={save}>💾 حفظ</button>
          <button className="btn-prev" onClick={() => preview(form)}>👁️ معاينة</button>
          <button className="btn-clear" onClick={() => setForm(BLANK)}>مسح الحقول</button>
        </div>
      </div>

      <div className="admin-list">
        {gifts.map((g) => (
          <div key={g.id} className={`admin-gift rar-${g.rarity}`}>
            <span className="ag-emoji">{g.emoji}</span>
            <div className="ag-info">
              <b>{g.name}</b>
              <small>{g.id} · {g.rarity} · {g.renderer} · {g.duration}ms · 🪙{g.coins}</small>
            </div>
            <button onClick={() => preview(g)} title="معاينة" className="ap-ico-btn"><EyeIcon /></button>
            <button onClick={() => edit(g)} title="تحرير" className="ap-ico-btn"><EditIcon /></button>
            <button onClick={() => del(g.id)} title="حذف" className="ap-ico-btn del"><TrashIcon /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
