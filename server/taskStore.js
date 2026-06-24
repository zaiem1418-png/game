// مخزن المهام اليومية — يحفظ تقدّم كل مستخدم على القرص في tasks.json.
// كل مستخدم يُعرّف بمعرّفه الثابت (uid). المهام تتجدّد يومياً (بتوقيت الخادم):
// عند أول وصول في يوم جديد يُعاد ضبط التقدّم والاستلام للجميع تلقائياً.
//
// كل مهمة مكتملة تُمنح مكافأتها بالألماس عند ضغط المستخدم «استلام» (claim)،
// والخصم/الإضافة الفعلية للرصيد تتم في index.js عبر walletStore بعد التحقق هنا.

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, "tasks.json");

// تعريف المهام اليومية. goal = الهدف المطلوب (عدد مرات/أو ثوانٍ للجلوس).
// reward = الألماس الممنوح. unit = "count" عدّاد عادي، "seconds" يُعرض كدقائق.
export const TASK_DEFS = [
  { id: "daily_login", icon: "📅", title: "تسجيل الدخول اليومي", desc: "ادخل اللعبة اليوم", reward: 5, goal: 1, unit: "count" },
  { id: "join_room", icon: "🎙️", title: "ادخل غرفة صوتية", desc: "انضم لأي غرفة صوتية", reward: 5, goal: 1, unit: "count" },
  { id: "sit_seat", icon: "🪑", title: "اجلس على المايك نصف ساعة", desc: "اقعد على مقعد لمدة 30 دقيقة", reward: 5, goal: 1800, unit: "seconds" },
  { id: "play_game", icon: "🎮", title: "العب لعبة واحدة", desc: "ابدأ أي لعبة على طاولة", reward: 5, goal: 1, unit: "count" },
  { id: "send_gift", icon: "🎁", title: "أرسل هدية", desc: "أرسل هدية واحدة داخل غرفة", reward: 5, goal: 1, unit: "count" },
  { id: "post_moment", icon: "🌀", title: "انشر لحظة", desc: "انشر لحظة واحدة في اللحظات", reward: 5, goal: 1, unit: "count" },
];

const DEF_BY_ID = Object.fromEntries(TASK_DEFS.map((d) => [d.id, d]));

let state = { users: {} }; // uid -> { day, tasks: { id: { progress, claimed } } }

function cleanUid(uid) {
  return String(uid || "").trim().slice(0, 64);
}

// مفتاح اليوم بتوقيت الخادم المحلي (YYYY-MM-DD)
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function load() {
  if (existsSync(FILE)) {
    try {
      const data = JSON.parse(readFileSync(FILE, "utf8"));
      if (data && typeof data === "object" && data.users) {
        state = { users: data.users };
        return;
      }
    } catch {
      /* تالف → ابدأ فارغاً */
    }
  }
  state = { users: {} };
  persist();
}

let saveTimer = null;
function persist() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      writeFileSync(FILE, JSON.stringify(state, null, 2), "utf8");
    } catch (e) {
      console.error("تعذّر حفظ tasks.json:", e.message);
    }
  }, 200);
}

// يضمن سجلّ المستخدم لليوم الحالي — يُعيد الضبط إن تغيّر اليوم
function ensure(uid) {
  uid = cleanUid(uid);
  if (!uid) return null;
  const day = today();
  let u = state.users[uid];
  if (!u || u.day !== day) {
    u = { day, tasks: {} };
    state.users[uid] = u;
    persist();
  }
  return u;
}

function taskRec(u, id) {
  if (!u.tasks[id]) u.tasks[id] = { progress: 0, claimed: false };
  return u.tasks[id];
}

// يزيد تقدّم مهمة (بمقدار amount) محصوراً بالهدف. يُرجع true إن اكتملت الآن.
function progress(uid, id, amount = 1) {
  const def = DEF_BY_ID[id];
  if (!def) return false;
  const u = ensure(uid);
  if (!u) return false;
  const rec = taskRec(u, id);
  const wasDone = rec.progress >= def.goal;
  rec.progress = Math.min(def.goal, rec.progress + Math.max(0, amount));
  persist();
  return !wasDone && rec.progress >= def.goal;
}

// حالة كل المهام للعرض في الواجهة
function status(uid) {
  const u = ensure(uid);
  const tasks = TASK_DEFS.map((def) => {
    const rec = u ? taskRec(u, def.id) : { progress: 0, claimed: false };
    return {
      id: def.id,
      icon: def.icon,
      title: def.title,
      desc: def.desc,
      reward: def.reward,
      goal: def.goal,
      unit: def.unit,
      progress: Math.min(def.goal, rec.progress),
      done: rec.progress >= def.goal,
      claimed: !!rec.claimed,
    };
  });
  const claimable = tasks.filter((t) => t.done && !t.claimed).length;
  return { day: u?.day || today(), tasks, claimable };
}

// استلام مكافأة مهمة مكتملة. يُرجع { ok, reward } أو { ok:false, error }.
// لا يلمس الرصيد — المنادي (index.js) يضيف الألماس عبر walletStore.
function claim(uid, id) {
  const def = DEF_BY_ID[id];
  if (!def) return { ok: false, error: "مهمة غير معروفة" };
  const u = ensure(uid);
  if (!u) return { ok: false, error: "سجّل دخولك أولاً" };
  const rec = taskRec(u, id);
  if (rec.progress < def.goal) return { ok: false, error: "المهمة غير مكتملة بعد" };
  if (rec.claimed) return { ok: false, error: "استلمت هذه المكافأة" };
  rec.claimed = true;
  persist();
  return { ok: true, reward: def.reward };
}

export const taskStore = {
  init: load,
  TASK_DEFS,
  progress,
  status,
  claim,
};
