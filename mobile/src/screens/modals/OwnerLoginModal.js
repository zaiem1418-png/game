import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import Sheet from "../../components/Sheet";
import { ownerLogin } from "../../api";

// دخول مالك اللعبة بكلمة السر — يمنحه رصيداً لانهائياً (👑).
// يُفتح بنقرة مزدوجة على الأفاتار في شاشة «أنا» (مخفي عن المستخدم العادي).
export default function OwnerLoginModal({ visible, onClose, uid, onSuccess }) {
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!key.trim() || busy) return;
    setError("");
    setBusy(true);
    try {
      const res = await ownerLogin(uid, key.trim());
      onSuccess?.(res.wallet);
      setKey("");
      onClose?.();
    } catch (err) {
      setError(err.message || "فشل الدخول");
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setKey("");
    setError("");
    onClose?.();
  }

  return (
    <Sheet visible={visible} onClose={close} title="👑 دخول المالك">
      <View style={styles.body}>
        <Text style={styles.sub}>للمالك فقط — رصيد ألماس وكوينز لانهائي</Text>
        <TextInput
          style={styles.input}
          placeholder="كلمة سر المالك"
          placeholderTextColor="#6d8a84"
          secureTextEntry
          autoFocus
          value={key}
          onChangeText={setKey}
          onSubmitEditing={submit}
          returnKeyType="go"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          style={[styles.btn, (busy || !key.trim()) && styles.btnDisabled]}
          onPress={submit}
          disabled={busy || !key.trim()}
        >
          <Text style={styles.btnTxt}>{busy ? "جارٍ التحقق…" : "دخول"}</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { padding: 18, gap: 12 },
  sub: { color: "#9dc0b8", fontSize: 13, textAlign: "center" },
  input: {
    backgroundColor: "rgba(30,90,86,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#eaf6f3",
    fontSize: 15,
    textAlign: "right",
  },
  error: { color: "#ff8a6a", fontSize: 13, textAlign: "center" },
  btn: {
    backgroundColor: "#1f9a7c",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  btnTxt: { color: "#eafff8", fontWeight: "800", fontSize: 15 },
});
