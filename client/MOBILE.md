# تطبيق الموبايل (Android) — Capacitor

هذا المجلد يحتوي نسخة الموبايل من الغرفة الصوتية. التطبيق يغلّف **نفس كود
الويب** (React + Vite) داخل تطبيق Android حقيقي عبر [Capacitor](https://capacitorjs.com).
لا يوجد كود واجهة منفصل — أي تعديل على الويب ينعكس على التطبيق بعد إعادة المزامنة.

## المتطلبات (تُثبَّت مرة واحدة)

- **JDK 21** (Capacitor 8 يتطلب Java 21، وليس 17).
  - المسار الحالي: `C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot`
- **Android SDK** (platform-tools, `platforms;android-36`, `build-tools;36.0.0`).
  - المسار الحالي: `C:\Users\Huawei\AppData\Local\Android\Sdk`
- ملف `android/local.properties` يشير لمسار الـSDK (غير مُتتبَّع في git).

## إعادة بناء الـAPK بعد أي تعديل

```bash
cd client
npm run build              # بناء الويب إلى dist/
npx cap sync android       # نسخ dist إلى المشروع الأصلي
```

ثم من مجلد android:

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
cd android
.\gradlew.bat assembleDebug --no-daemon
```

الناتج:
`client/android/app/build/outputs/apk/debug/app-debug.apk`

اختصار: `npm run mobile:apk` يقوم بالبناء + المزامنة + تجميع الـAPK دفعة واحدة
(بشرط ضبط `JAVA_HOME` على JDK 21 في البيئة).

## ملاحظات مهمة

- **السيرفر:** داخل التطبيق يقرأ [src/serverUrl.js](src/serverUrl.js) أن المنصّة
  أصلية (Capacitor) فيتصل دائماً بسيرفر Render
  (`https://voice-room-server.onrender.com`) لأنه لا يوجد سيرفر محلي على الجهاز.
- **الصوت:** الأذونات (مايك/كاميرا/بلوتوث) مضافة في
  [android/app/src/main/AndroidManifest.xml](android/app/src/main/AndroidManifest.xml)
  للصوت الحقيقي (WebRTC/LiveKit).
- **معرّف التطبيق:** `com.voiceroom.app` — الاسم: «الغرفة الصوتية».
- **للنشر على Google Play:** يلزم بناء `assembleRelease` موقّع بمفتاح (keystore)
  بدل نسخة الـdebug.

## التثبيت على الهاتف

انسخ `app-debug.apk` إلى الهاتف وثبّته (فعّل «تثبيت من مصادر غير معروفة»).
نسخة جاهزة أيضاً على سطح المكتب: `VoiceRoom-debug.apk`.
