# صور الألعاب (نسخة الموبايل)

ضع هنا صور المشاهد الترويجية لكل لعبة — نفس صور الويب الموجودة في
`client/public/games/`. الأسماء يجب أن تطابق مُعرّف اللعبة (`id`):

| اللعبة   | ضع الملف باسم                     | مصدره في الويب              |
|----------|-----------------------------------|----------------------------|
| جاكارو   | `mobile/assets/games/jackaroo.png`| `client/public/games/jackaroo.png` |
| لودو     | `mobile/assets/games/ludo.png`    | `client/public/games/ludo.png`     |
| بلوت     | `mobile/assets/games/baloot.png`  | `client/public/games/baloot.png`   |
| السلم    | `mobile/assets/games/snake.png`   | `client/public/games/snake.png`    |

## بعد وضع الصور — كيف تُفعّلها

على عكس الويب، React Native لا يقبل مسارات نصية مثل `/games/ludo.png`؛
يجب استيراد كل صورة عبر `require`. أضف هذه الخريطة في أعلى
`mobile/src/screens/GameHomeScreen.js`:

```js
const HERO_IMAGES = {
  jackaroo: require("../../assets/games/jackaroo.png"),
  ludo: require("../../assets/games/ludo.png"),
  baloot: require("../../assets/games/baloot.png"),
  snake: require("../../assets/games/snake.png"),
};
```

ثم داخل `<LinearGradient ... style={styles.hero}>` أضِف كطبقة خلفية أعلى التدرّج:

```jsx
import { Image } from "react-native";
...
{HERO_IMAGES[game.id] && (
  <Image source={HERO_IMAGES[game.id]} style={StyleSheet.absoluteFill} resizeMode="cover" />
)}
```

(ضعها قبل عنصر `heroTitle` مباشرةً حتى يظهر العنوان فوق الصورة.)

## أيقونات الألعاب ثلاثية الأبعاد ✅ (مربوطة بالفعل)

الأيقونات (نفس أيقونات الويب من `client/public/games/icons/`) منسوخة إلى
`mobile/assets/games/icons/` ومربوطة في `GameHomeScreen.js` عبر سجلّ `ICONS`.
مستخدمة الآن في: السكك الجانبية (العب/نادي/عصبة/أصدقاء)، بلاطة النمط الكبير
(VS)، بلاطات الأنماط الصغيرة (حقل `icon` لكل نمط في `data/games.js`)،
الأزرار السريعة (مسابقات/VIP/أصدقاء)، بلاطات الألعاب، وشريط الشخصيات.
لتبديل أيقونة نمط: عدّل حقل `icon` في `mobile/src/data/games.js`.
الإيموجي باقٍ فقط حيث لا توجد أيقونة مطابقة (👑 التاج، ★ النجمة، 🔊 الصوت، ⏱ المؤقّت).
