// إدارة الصوت عبر WebRTC (شبكة mesh نظير-لنظير)
// - كل عضو يتصل بكل الأعضاء.
// - المايك يُرسل فعلياً فقط عند الجلوس على مقعد وعدم الكتم (نتحكم بـ track.enabled).
// - كشف التحدّث الحقيقي عبر تحليل مستوى الصوت (Web Audio).
// السيرفر يمرّر الإشارات فقط؛ الصوت ينتقل مباشرة بين الأجهزة.

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  // خوادم TURN مجانية (Open Relay) — تساعد على الاتصال عبر شبكات الجوال والـNAT الصارم
  {
    urls: ["turn:openrelay.metered.ca:80", "turn:openrelay.metered.ca:443"],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

export class VoiceManager {
  constructor(socket) {
    this.socket = socket;
    this.peers = new Map(); // id -> RTCPeerConnection
    this.audioEls = new Map(); // id -> <audio>
    this.localStream = null;
    this.selfId = null;
    this.ready = false;
    this._pendingIds = [];
    this.onSpeakingChange = null; // callback(boolean) لحالة تحدّث المستخدم نفسه
    this.onMicError = null; // callback عند رفض إذن المايك
    this._bindSignaling();
  }

  // طلب إذن المايك وتهيئة كشف التحدّث
  async init(selfId) {
    this.selfId = selfId;
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      // المايك مغلق حتى يجلس المستخدم ويفك الكتم
      this.localStream.getAudioTracks().forEach((t) => (t.enabled = false));
      this._setupVoiceDetection();
    } catch (err) {
      console.warn("تعذّر الوصول للمايك:", err?.message || err);
      this.localStream = null;
      this.onMicError?.(err);
    }
    this.ready = true;
    if (this._pendingIds.length) this.syncPeers(this._pendingIds);
  }

  // تفعيل/تعطيل إرسال المايك فعلياً
  setMicEnabled(enabled) {
    if (!this.localStream) return;
    this.localStream.getAudioTracks().forEach((t) => (t.enabled = enabled));
  }

  // مزامنة الاتصالات مع قائمة الأعضاء الحالية
  syncPeers(memberIds) {
    this._pendingIds = memberIds;
    if (!this.ready) return;

    // أنشئ اتصالات للأعضاء الجدد
    for (const id of memberIds) {
      if (id === this.selfId) continue;
      if (!this.peers.has(id)) {
        // الطرف صاحب المعرّف الأصغر يبدأ العرض (لتفادي التضارب)
        this._createPeer(id, this.selfId < id);
      }
    }
    // أغلق اتصالات الأعضاء الذين غادروا
    for (const id of [...this.peers.keys()]) {
      if (!memberIds.includes(id)) this._closePeer(id);
    }
  }

  async _createPeer(id, isInitiator) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pc._pendingCandidates = [];
    this.peers.set(id, pc);

    // أضف مسار المايك (أو استقبال فقط إن لم يتوفر مايك)
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => pc.addTrack(t, this.localStream));
    } else {
      pc.addTransceiver("audio", { direction: "recvonly" });
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.socket.emit("voice:signal", { to: id, data: { candidate: e.candidate } });
      }
    };

    pc.ontrack = (e) => this._attachAudio(id, e.streams[0]);

    pc.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
        // إعادة محاولة بسيطة عند الفشل
        if (pc.connectionState === "failed") this._closePeer(id);
      }
    };

    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.socket.emit("voice:signal", { to: id, data: { sdp: pc.localDescription } });
      } catch (e) {
        console.warn("فشل إنشاء العرض:", e);
      }
    }
    return pc;
  }

  _attachAudio(id, stream) {
    let el = this.audioEls.get(id);
    if (!el) {
      el = document.createElement("audio");
      el.autoplay = true;
      el.playsInline = true;
      el.dataset.peer = id;
      document.body.appendChild(el);
      this.audioEls.set(id, el);
    }
    el.srcObject = stream;
    el.play().catch(() => {});
  }

  _closePeer(id) {
    const pc = this.peers.get(id);
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      try { pc.close(); } catch {}
      this.peers.delete(id);
    }
    const el = this.audioEls.get(id);
    if (el) {
      el.srcObject = null;
      el.remove();
      this.audioEls.delete(id);
    }
  }

  _bindSignaling() {
    this.socket.on("voice:signal", async ({ from, data }) => {
      let pc = this.peers.get(from);
      if (!pc) {
        // وصلنا عرض من طرف لم ننشئ له اتصالاً بعد → ننشئه كمستقبِل
        pc = await this._createPeer(from, false);
      }
      try {
        if (data.sdp) {
          await pc.setRemoteDescription(data.sdp);
          // أفرغ مرشحات ICE المؤجلة
          for (const c of pc._pendingCandidates) {
            try { await pc.addIceCandidate(c); } catch {}
          }
          pc._pendingCandidates = [];

          if (data.sdp.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            this.socket.emit("voice:signal", { to: from, data: { sdp: pc.localDescription } });
          }
        } else if (data.candidate) {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(data.candidate);
          } else {
            pc._pendingCandidates.push(data.candidate);
          }
        }
      } catch (e) {
        console.warn("خطأ في معالجة الإشارة:", e);
      }
    });
  }

  // كشف التحدّث الحقيقي من مستوى صوت المايك
  _setupVoiceDetection() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      ctx.resume?.();
      const source = ctx.createMediaStreamSource(this.localStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let speaking = false;

      const loop = () => {
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        const avg = sum / data.length;
        const micOn = this.localStream?.getAudioTracks()[0]?.enabled;
        const now = !!micOn && avg > 18; // عتبة التحدّث
        if (now !== speaking) {
          speaking = now;
          this.onSpeakingChange?.(now);
        }
        this._raf = requestAnimationFrame(loop);
      };
      loop();
    } catch (e) {
      console.warn("تعذّر تفعيل كشف التحدّث:", e);
    }
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    for (const id of [...this.peers.keys()]) this._closePeer(id);
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.socket.off("voice:signal");
  }
}
