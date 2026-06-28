// مخزن مساهمات الأغاني — يحفظ الأغاني التي يقترحها المستخدمون لتُضاف لمكتبة
// الغرف الصوتية لاحقاً. يُحفظ على القرص في songs.json.

import { readFileSync, writeFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE = join(__dirname, "songs.json");

function clean(t, max) {
  return String(t || "").replace(/\s+/g, " ").trim().slice(0, max);
}
function rid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

let songs = []; // { id, uid, title, artist, ts, votes:[uid], status }

function load() {
  if (existsSync(FILE)) {
    try {
      const data = JSON.parse(readFileSync(FILE, "utf8"));
      if (Array.isArray(data)) { songs = data; return; }
    } catch { /* تالف → ابدأ فارغاً */ }
  }
  songs = [];
  persist();
}

let saveTimer = null;
function persist() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try { writeFileSync(FILE, JSON.stringify(songs, null, 2), "utf8"); }
    catch (e) { console.error("تعذّر حفظ songs.json:", e.message); }
  }, 200);
}

function add(uid, title, artist) {
  uid = String(uid || "").slice(0, 64);
  title = clean(title, 80);
  artist = clean(artist, 60);
  if (!title) return { ok: false, error: "اكتب اسم الأغنية" };
  // امنع التكرار القريب (نفس العنوان من نفس المستخدم)
  if (songs.some((s) => s.uid === uid && s.title.toLowerCase() === title.toLowerCase())) {
    return { ok: false, error: "اقترحت هذه الأغنية من قبل" };
  }
  const song = { id: rid(), uid, title, artist, ts: Date.now(), votes: [], status: "pending" };
  songs.unshift(song);
  if (songs.length > 500) songs.length = 500;
  persist();
  return { ok: true, song: view(song, uid) };
}

function vote(uid, songId) {
  uid = String(uid || "").slice(0, 64);
  const s = songs.find((x) => x.id === songId);
  if (!s) return { ok: false, error: "الأغنية غير موجودة" };
  const i = s.votes.indexOf(uid);
  if (i === -1) s.votes.push(uid); else s.votes.splice(i, 1);
  persist();
  return { ok: true, votes: s.votes.length, votedByMe: i === -1 };
}

function view(s, viewerUid) {
  return {
    id: s.id,
    title: s.title,
    artist: s.artist,
    ts: s.ts,
    status: s.status,
    votes: s.votes.length,
    votedByMe: viewerUid ? s.votes.includes(viewerUid) : false,
    mine: viewerUid ? s.uid === viewerUid : false,
  };
}

function list(viewerUid, limit = 80) {
  return songs
    .slice()
    .sort((a, b) => b.votes.length - a.votes.length || b.ts - a.ts)
    .slice(0, limit)
    .map((s) => view(s, viewerUid));
}

export const profileStore = { init: load, add, vote, list };
