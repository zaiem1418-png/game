# 🌐 نشر الغرفة الصوتية (Deploy)

المشروع ثلاث قطع:
- **السيرفر** (`server/`) → يحتاج استضافة دائمة → **Render** (حالة الغرفة + إصدار توكن الصوت).
- **الواجهة** (`client/`) → ملفات ثابتة → **Vercel**.
- **الصوت** → **LiveKit Cloud** (بنية SFU تدعم 10 أشخاص وأكثر يتحدثون معاً).

---

## ⚡ المسار السريع: جرّبه على جوالك الآن (نفق محلي)

لو السيرفر والواجهة شغّالين عندك محلياً، افتح نفقاً مؤقتاً بدون نشر:

```bash
# ثبّت cloudflared مرة واحدة (أو استخدم ngrok)
npx cloudflared tunnel --url http://localhost:5173
```
يعطيك رابطاً مثل `https://xxxx.trycloudflare.com` تفتحه من جوالك.

> ملاحظة: لأن السيرفر على `localhost:3001`، لتجربة كاملة من جهاز آخر تحتاج نفقاً للسيرفر أيضاً، ثم تضع رابطه في `VITE_SERVER_URL`. للتجربة الحقيقية المشتركة، الأفضل النشر الكامل بالأسفل.

---

## ☁️ المسار الكامل: رابط دائم على النت (مجاني)

### الخطوة 0: ارفع المشروع على GitHub
```bash
cd "c:/Users/Huawei/Desktop/game"
git init
git add .
git commit -m "voice room app"
# أنشئ مستودعاً على github.com ثم:
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

### الخطوة 1: جهّز الصوت على LiveKit Cloud (مجاني)
1. ادخل [cloud.livekit.io](https://cloud.livekit.io) وأنشئ مشروعاً.
2. من **Settings ➜ Keys** انسخ الثلاثة:
   - `LIVEKIT_URL` (يبدأ بـ `wss://`)
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
   > الخطة المجانية: 5000 دقيقة/شهر وحتى 50 شخصاً في الغرفة.

### الخطوة 2: انشر السيرفر على Render
1. ادخل [render.com](https://render.com) وسجّل بحساب GitHub.
2. **New ➜ Web Service** واختر مستودعك.
3. الإعدادات:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
   - الخطة: **Free**
4. في **Environment** أضف مفاتيح LiveKit الثلاثة من الخطوة 1:
   `LIVEKIT_URL` · `LIVEKIT_API_KEY` · `LIVEKIT_API_SECRET`
5. اضغط **Create** — بعد دقيقة يعطيك رابطاً مثل:
   `https://voice-room-server.onrender.com`
   > (أو استخدم ملف `render.yaml` الجاهز عبر New ➜ Blueprint ثم أضف المفاتيح في Environment).

> 🎙️ الصوت ينتقل عبر LiveKit Cloud مباشرة؛ السيرفر يُصدر توكن الدخول فقط.

### الخطوة 3: انشر الواجهة على Vercel
1. ادخل [vercel.com](https://vercel.com) بحساب GitHub.
2. **Add New ➜ Project** واختر نفس المستودع.
3. الإعدادات:
   - **Root Directory:** `client`
   - **Framework Preset:** Vite (يكتشفه تلقائياً)
   - **Build Command:** `npm run build` · **Output:** `dist`
4. في **Environment Variables** أضف:
   - `VITE_SERVER_URL` = رابط سيرفر Render (من الخطوة 1)
5. اضغط **Deploy** — يعطيك رابط الواجهة النهائي 🎉

### الخطوة 4: جرّب
افتح رابط Vercel من أي جهاز/جوال، وافتحه على عدة أجهزة لتجربة الصوت الجماعي.

---

## ⚠️ ملاحظات
- خطة Render المجانية **تنام** بعد خمول، فأول دخول قد يتأخر ~30 ثانية (تستيقظ تلقائياً).
- لو ظهرت مشكلة اتصال، تأكد أن `VITE_SERVER_URL` على Vercel = رابط Render **بدون / في النهاية**.
- CORS مفتوح في السيرفر (`origin: *`) فالربط يعمل مباشرة.
