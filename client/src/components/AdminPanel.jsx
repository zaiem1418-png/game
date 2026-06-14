// لوحة إدارة الهدايا — إضافة/تحرير/حذف هدايا دون تعديل الكود، مع معاينة حيّة للأنيميشن.
// الوصول: افتح التطبيق بالرابط ?admin — أدخل رمز الإدارة (افتراضي admin123، غيّره عبر ADMIN_TOKEN).

import { useEffect, useRef, useState } from "react";
import GiftStage from "../giftEngine/GiftStage.jsx";
import { BUILTIN_SOUNDS } from "../giftEngine/core/SoundManager.js";
import { SCENARIOS } from "../giftEngine/scenarios.js";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
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
  const stageRef = useRef(null);

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
            <button onClick={() => preview(g)} title="معاينة">👁️</button>
            <button onClick={() => edit(g)} title="تحرير">✏️</button>
            <button onClick={() => del(g.id)} title="حذف">🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}
