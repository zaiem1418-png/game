// إدارة الصوت عبر LiveKit Cloud (بنية SFU).
// - كل عضو يرفع نسخة واحدة من صوته للخادم، والخادم يوزّعها على الباقين.
// - تدعم 10+ أشخاص يتحدثون معاً (عكس Mesh القديمة التي تنهار بعد ~6).
// - المايك يُنشر فقط عند الجلوس على مقعد وفك الكتم.
// - كشف التحدّث يأتي جاهزاً من LiveKit (ActiveSpeakers).

// ملاحظة أداء: مكتبة livekit-client ثقيلة (~مئات الكيلوبايت). لا نستوردها بشكل
// ثابت حتى لا تُحمَّل مع الشاشة الأولى (واجهة الألعاب)؛ نجلبها ديناميكياً فقط
// عند أول دخول لغرفة صوتية. هذا يسرّع التحميل الأولي للعبة بشكل كبير.
import { SERVER_URL } from "./serverUrl.js";

let _lkPromise = null;
function loadLiveKit() {
  if (!_lkPromise) _lkPromise = import("livekit-client");
  return _lkPromise;
}

// نطلب التوكن من سيرفر الحالة (Render) — المفاتيح السرية تبقى هناك.

export class VoiceManager {
  constructor() {
    this.room = null;
    this.selfId = null;
    this.ready = false;
    this._ConnectionState = null; // يُملأ بعد تحميل livekit
    this._micWanted = false; // هل يريد المستخدم نشر المايك حالياً؟
    this._lastSpeaking = false;
    this._audioEls = new Map(); // identity -> <audio>
    this.onSpeakingChange = null; // callback(boolean) لتحدّث المستخدم نفسه
    this.onMicError = null; // callback عند فشل المايك/الاتصال
    this.onPeersChange = null; // callback(Array) للوحة التشخيص
  }

  // اتصل بغرفة LiveKit: اجلب التوكن ثم انضمّ
  async init({ identity, name, roomId }) {
    this.selfId = identity;

    // حمّل مكتبة الصوت ديناميكياً عند الحاجة فقط
    const { Room, RoomEvent, Track, ConnectionState } = await loadLiveKit();
    this._ConnectionState = ConnectionState;

    let token, url;
    try {
      const qs = new URLSearchParams({ room: roomId, identity, name: name || "زائر" });
      const res = await fetch(`${SERVER_URL}/api/voice-token?${qs}`);
      if (!res.ok) throw new Error("token HTTP " + res.status);
      ({ token, url } = await res.json());
    } catch (err) {
      console.warn("تعذّر جلب توكن الصوت:", err?.message || err);
      this.onMicError?.(err);
      return;
    }

    const room = new Room({ adaptiveStream: false, dynacast: true });
    this.room = room;

    room
      .on(RoomEvent.TrackSubscribed, (track, _pub, participant) => {
        if (track.kind === Track.Kind.Audio) this._attach(participant.identity, track);
      })
      .on(RoomEvent.TrackUnsubscribed, (track, _pub, participant) => {
        if (track.kind === Track.Kind.Audio) this._detach(participant.identity);
      })
      .on(RoomEvent.ParticipantConnected, () => this._emitPeers())
      .on(RoomEvent.ParticipantDisconnected, () => this._emitPeers())
      .on(RoomEvent.ConnectionQualityChanged, () => this._emitPeers())
      .on(RoomEvent.LocalTrackPublished, () => this._emitPeers())
      .on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const meSpeaking = speakers.some((p) => p.isLocal);
        if (meSpeaking !== this._lastSpeaking) {
          this._lastSpeaking = meSpeaking;
          this.onSpeakingChange?.(meSpeaking);
        }
      });

    try {
      await room.connect(url, token);
      this.ready = true;
      // تشغيل الصوت قد يُحظر حتى أول تفاعل — نعالجه عند أول نقرة
      try { await room.startAudio(); } catch { this._retryAudioOnGesture(); }
      // طبّق رغبة المايك إن طُلبت قبل اكتمال الاتصال
      if (this._micWanted) this.setMicEnabled(true);
    } catch (err) {
      console.warn("تعذّر الاتصال بـ LiveKit:", err?.message || err);
      this.onMicError?.(err);
    }
    this._emitPeers();
  }

  // LiveKit يدير الأنداد تلقائياً — لا حاجة للمزامنة اليدوية (للتوافق مع الكود القديم)
  syncPeers() {}

  // نشر/إيقاف المايك فعلياً (publish/unpublish على مستوى الخادم)
  async setMicEnabled(enabled) {
    this._micWanted = enabled;
    if (!this.room || this.room.state !== this._ConnectionState?.Connected) return;
    try {
      await this.room.localParticipant.setMicrophoneEnabled(enabled, {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });
    } catch (err) {
      console.warn("تعذّر ضبط المايك:", err?.message || err);
      if (enabled) this.onMicError?.(err);
    }
  }

  _attach(id, track) {
    this._detach(id); // نظّف أي عنصر سابق لنفس العضو
    const el = track.attach(); // ينشئ <audio> ويربط الصوت
    el.autoplay = true;
    el.dataset.peer = id;
    document.body.appendChild(el);
    this._audioEls.set(id, el);
    el.play?.().catch(() => this._retryAudioOnGesture());
  }

  _detach(id) {
    const el = this._audioEls.get(id);
    if (el) {
      el.srcObject = null;
      el.remove();
      this._audioEls.delete(id);
    }
  }

  // أعد محاولة تشغيل الصوت عند أول نقرة/لمسة (تجاوز حظر التشغيل التلقائي)
  _retryAudioOnGesture() {
    const retry = () => {
      this.room?.startAudio?.().catch(() => {});
      for (const el of this._audioEls.values()) el.play?.().catch(() => {});
      document.removeEventListener("click", retry);
      document.removeEventListener("touchstart", retry);
    };
    document.addEventListener("click", retry);
    document.addEventListener("touchstart", retry);
  }

  // أبلغ الواجهة بحالة المشاركين (للوحة التشخيص)
  _emitPeers() {
    if (!this.onPeersChange || !this.room) return;
    const list = [...this.room.remoteParticipants.values()].map((p) => ({
      id: p.identity,
      state: p.connectionQuality || "connected",
      ice: p.audioTrackPublications.size ? "🎤" : "👂",
    }));
    this.onPeersChange(list);
  }

  destroy() {
    for (const el of this._audioEls.values()) {
      el.srcObject = null;
      el.remove();
    }
    this._audioEls.clear();
    try { this.room?.disconnect(); } catch {}
    this.room = null;
    this.ready = false;
  }
}
