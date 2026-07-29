import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Switch, Pressable, Alert } from "react-native";
import Sheet from "../../components/Sheet";
import { loadSettings, saveSettings, DEFAULT_SETTINGS, resetAllData } from "../../settings";
import { SERVER_URL } from "../../config";

const APP_VERSION = "1.0.0";

// صفّ تبديل (Switch) مع أيقونة ووصف — يحفظ فوراً على الجهاز.
function ToggleRow({ icon, label, desc, value, onValueChange }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowIco}>{icon}</Text>
      <View style={styles.rowInfo}>
        <Text style={styles.rowLbl}>{label}</Text>
        {desc ? <Text style={styles.rowDesc}>{desc}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "rgba(255,255,255,0.15)", true: "#1f9a7c" }}
        thumbColor={value ? "#5fe0bd" : "#c9dad5"}
      />
    </View>
  );
}

// صفّ إجراء قابل للضغط (بسهم) — يفتح شاشة أو ينفّذ فعلاً.
function ActionRow({ icon, label, value, danger, onPress }) {
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <Text style={styles.rowIco}>{icon}</Text>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowLbl, danger && { color: "#ff8a6a" }]}>{label}</Text>
      </View>
      {value ? <Text style={styles.rowVal} numberOfLines={1}>{value}</Text> : null}
      {onPress ? <Text style={styles.chev}>‹</Text> : null}
    </Pressable>
  );
}

// نظام الإعدادات الاحترافي ⚙️ — الصوت/الإشعارات/العرض/الحساب/عن التطبيق.
export default function SettingsModal({ visible, onClose, identity, onEditProfile }) {
  const [s, setS] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    if (visible) loadSettings().then(setS);
  }, [visible]);

  const set = (key) => (val) => {
    const next = { ...s, [key]: val };
    setS(next);
    saveSettings(next); // حفظ فوري
  };

  const editProfile = () => {
    onClose?.();
    onEditProfile?.();
  };

  const confirmReset = () => {
    Alert.alert(
      "مسح بيانات الحساب",
      "سيُحذف الاسم والصورة والإعدادات من هذا الجهاز. لا يمكن التراجع.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "مسح",
          style: "destructive",
          onPress: async () => {
            await resetAllData();
            Alert.alert("تمّ المسح", "أعد تشغيل التطبيق لتطبيق التغيير.");
          },
        },
      ]
    );
  };

  const uidShort = identity?.uid ? `${identity.uid.slice(0, 10)}…` : "—";

  return (
    <Sheet visible={visible} onClose={onClose} title="⚙️ الإعدادات">
      <ScrollView contentContainerStyle={{ padding: 14, gap: 16 }}>
        {/* الملف الشخصي */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>الملف الشخصي</Text>
          <ActionRow icon="👤" label="تعديل الاسم والصورة" onPress={editProfile} />
        </View>

        {/* الصوت */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>الصوت والاهتزاز</Text>
          <ToggleRow icon="🔊" label="المؤثرات الصوتية" value={s.sfx} onValueChange={set("sfx")} />
          <ToggleRow icon="🎵" label="الموسيقى" value={s.music} onValueChange={set("music")} />
          <ToggleRow icon="📳" label="الاهتزاز" value={s.vibration} onValueChange={set("vibration")} />
        </View>

        {/* الإشعارات والعرض */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>الإشعارات والعرض</Text>
          <ToggleRow icon="🔔" label="الإشعارات" desc="تنبيهات الدعوات والمكافآت" value={s.notifications} onValueChange={set("notifications")} />
          <ToggleRow icon="🌙" label="الوضع الليلي" value={s.darkMode} onValueChange={set("darkMode")} />
          <ActionRow icon="🌐" label="اللغة" value="العربية" />
        </View>

        {/* الحساب */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>الحساب</Text>
          <ActionRow icon="🆔" label="معرّف الحساب" value={uidShort} />
          <ActionRow icon="🖥️" label="الخادم" value={SERVER_URL.replace(/^https?:\/\//, "")} />
        </View>

        {/* عن التطبيق */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>عن التطبيق</Text>
          <ActionRow icon="ℹ️" label="الإصدار" value={APP_VERSION} />
          <ActionRow icon="🗑️" label="مسح بيانات الحساب" danger onPress={confirmReset} />
        </View>

        <Text style={styles.footer}>ألعاب صوتية · الإصدار {APP_VERSION}</Text>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  group: { gap: 2 },
  groupTitle: { color: "#5fe0bd", fontWeight: "800", fontSize: 12, textAlign: "right", marginBottom: 6, marginRight: 4 },
  row: {
    flexDirection: "row-reverse", alignItems: "center", gap: 12,
    backgroundColor: "rgba(30,90,86,0.35)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
  },
  rowIco: { fontSize: 20, width: 26, textAlign: "center" },
  rowInfo: { flex: 1 },
  rowLbl: { color: "#eaf6f3", fontWeight: "700", fontSize: 14, textAlign: "right" },
  rowDesc: { color: "#9dc0b8", fontSize: 11, textAlign: "right", marginTop: 2 },
  rowVal: { color: "#9dc0b8", fontSize: 12, maxWidth: 150 },
  chev: { color: "#6d8a84", fontSize: 22, marginRight: 2 },
  footer: { color: "#4d6d67", fontSize: 11, textAlign: "center", marginTop: 4, marginBottom: 8 },
});
