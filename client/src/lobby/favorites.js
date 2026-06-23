// مفضّلة الغرف — تُحفظ محلياً على الجهاز (localStorage) بقائمة معرّفات الغرف.
// تتيح للمستخدم إضافة غرفة للمفضّلة والعودة إليها بسرعة من تبويب «المفضلة».

const KEY = "jackaroo_fav_rooms";

export function getFavorites() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

export function isFavorite(id) {
  return getFavorites().includes(String(id));
}

// يبدّل حالة المفضّلة لغرفة ويعيد القائمة الجديدة بعد الحفظ.
export function toggleFavorite(id) {
  id = String(id);
  const cur = getFavorites();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
