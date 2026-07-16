// هوية المستخدم على الجهاز: معرّف ثابت (uid) + الاسم + الأفاتار.
// نفس فكرة الويب (localStorage) لكن عبر AsyncStorage، ونفس مفتاح الـuid
// "jackaroo_uid" ليُربط بنفس المحفظة على السيرفر.
import AsyncStorage from "@react-native-async-storage/async-storage";

const UID_KEY = "jackaroo_uid";
const NAME_KEY = "jackaroo_name";
const AVATAR_KEY = "jackaroo_avatar";

function makeUid() {
  return "u_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function getIdentity() {
  let uid = await AsyncStorage.getItem(UID_KEY);
  if (!uid) {
    uid = makeUid();
    await AsyncStorage.setItem(UID_KEY, uid);
  }
  const name = (await AsyncStorage.getItem(NAME_KEY)) || "";
  const avatar = (await AsyncStorage.getItem(AVATAR_KEY)) || null;
  return { uid, name, avatar };
}

export async function saveProfile({ name, avatar }) {
  if (name != null) await AsyncStorage.setItem(NAME_KEY, String(name).slice(0, 20));
  if (avatar != null) await AsyncStorage.setItem(AVATAR_KEY, String(avatar));
}
