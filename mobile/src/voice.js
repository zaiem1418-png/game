// إدارة الصوت الحقيقي في الموبايل عبر LiveKit (نفس بنية SFU المستخدمة في الويب).
// - نفس السيرفر ونفس نقطة /api/voice-token، فيتكلّم مستخدم الموبايل مع الويب
//   في نفس الغرفة تلقائياً.
// - المايك يُنشر فقط عند الجلوس على مقعد وفكّ الكتم.
// - كشف التحدّث يأتي جاهزاً من LiveKit (ActiveSpeakers) عبر onSpeakingChange.
//
// ملاحظة: @livekit/react-native يعتمد وحدات أصلية (WebRTC) لا يدعمها Expo Go —
// يتطلب Development Build. لذلك نحمّل المكتبة بأمان (try/require)؛ فإن لم تكن
// موجودة (Expo Go) يبقى الصوت معطّلاً بصمت دون أن ينهار التطبيق.
import { SERVER_URL } from "./config";

let _lk = null;
let _loaded = false;
function loadLiveKit() {
  if (_loaded) return _lk;
  _loaded = true;
  try {
    _lk = require("@livekit/react-native");
  } catch {
    _lk = null; // غير مثبّتة بعد (Expo Go) → الصوت معطّل
  }
  return _lk;
}

export class VoiceManager {
  constructor() {
    this.room = null;
    this.selfId = null;
    this.ready = false;
    this._micWanted = false;
    this._lastSpeaking = false;
    this._audioStarted = false;
    this._ConnectionState = null;
    this.onSpeakingChange = null; // callback(boolean) لتحدّث المستخدم نفسه
    this.onMicError = null; // callback عند فشل المايك/الاتصال/غياب المكتبة
  }

  // اتصل بغرفة LiveKit: اجلب التوكن من السيرفر ثم انضمّ
  async init({ identity, name, roomId }) {
    this.selfId = identity;

    const lk = loadLiveKit();
    if (!lk) {
      this.onMicError?.(new Error("livekit-not-installed"));
      return;
    }
    const { Room, RoomEvent, ConnectionState, AudioSession } = lk;
    this._ConnectionState = ConnectionState;

    let token, url;
    try {
      const qs = new URLSearchParams({ room: roomId, identity, name: name || "زائر" });
      const res = await fetch(`${SERVER_URL}/api/voice-token?${qs}`);
      if (!res.ok) throw new Error("token HTTP " + res.status);
      ({ token, url } = await res.json());
    } catch (err) {
      this.onMicError?.(err);
      return;
    }

    // فعّل جلسة الصوت (تشغيل الأصوات البعيدة + التقاط المايك) قبل الاتصال
    try {
      await AudioSession.startAudioSession();
      this._audioStarted = true;
    } catch {}

    const room = new Room({ adaptiveStream: false, dynacast: true });
    this.room = room;

    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      const meSpeaking = speakers.some((p) => p.isLocal);
      if (meSpeaking !== this._lastSpeaking) {
        this._lastSpeaking = meSpeaking;
        this.onSpeakingChange?.(meSpeaking);
      }
    });

    try {
      await room.connect(url, token);
      this.ready = true;
      // الأصوات البعيدة تُشغَّل تلقائياً عبر جلسة الصوت — لا حاجة لعناصر <audio>
      if (this._micWanted) this.setMicEnabled(true);
    } catch (err) {
      this.onMicError?.(err);
    }
  }

  // نشر/إيقاف المايك فعلياً على مستوى الخادم (publish/unpublish)
  async setMicEnabled(enabled) {
    this._micWanted = enabled;
    if (!this.room || this.room.state !== this._ConnectionState?.Connected) return;
    try {
      await this.room.localParticipant.setMicrophoneEnabled(enabled);
    } catch (err) {
      if (enabled) this.onMicError?.(err);
    }
  }

  async destroy() {
    try { this.room?.disconnect(); } catch {}
    this.room = null;
    this.ready = false;
    this._lastSpeaking = false;
    if (this._audioStarted) {
      try { await loadLiveKit()?.AudioSession?.stopAudioSession(); } catch {}
      this._audioStarted = false;
    }
  }
}
