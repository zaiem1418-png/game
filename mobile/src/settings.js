// إعدادات التطبيق المحفوظة على الجهاز (AsyncStorage).
// تُقرأ مرّة عند الإقلاع ثم تُحدَّث فورياً عند كل تبديل.
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "app_settings_v1";

export const DEFAULT_SETTINGS = {
  sfx: true, // المؤثرات الصوتية
  music: true, // الموسيقى
  vibration: true, // الاهتزاز
  notifications: true, // الإشعارات
  darkMode: true, // الوضع الليلي
};

export async function loadSettings() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(settings));
  } catch {}
}

// مسح كل بيانات الجهاز (الهوية + الإعدادات) — لإعادة الضبط.
export async function resetAllData() {
  try {
    await AsyncStorage.clear();
  } catch {}
}
