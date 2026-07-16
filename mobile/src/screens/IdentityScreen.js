import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { theme } from "../theme";
import { saveProfile } from "../identity";

export default function IdentityScreen({ identity, onSaved }) {
  const [name, setName] = useState(identity?.name || "");

  async function submit() {
    const clean = name.trim().slice(0, 20);
    if (!clean) return;
    await saveProfile({ name: clean });
    onSaved(clean);
  }

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.center}>
        <Text style={styles.logo}>🎙️</Text>
        <Text style={styles.title}>الغرفة الصوتية</Text>
        <Text style={styles.sub}>اكتب اسمك للدخول</Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="اسمك"
          placeholderTextColor={theme.textDim}
          style={styles.input}
          maxLength={20}
          textAlign="right"
          onSubmitEditing={submit}
          returnKeyType="done"
        />

        <Pressable
          style={[styles.btn, !name.trim() && styles.btnDisabled]}
          onPress={submit}
          disabled={!name.trim()}
        >
          <Text style={styles.btnText}>دخول</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  logo: { fontSize: 64, marginBottom: 8 },
  title: { color: theme.text, fontSize: 28, fontWeight: "800", marginBottom: 6 },
  sub: { color: theme.textDim, fontSize: 15, marginBottom: 28 },
  input: {
    width: "100%",
    backgroundColor: theme.card,
    borderColor: theme.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: theme.text,
    fontSize: 17,
    marginBottom: 18,
  },
  btn: {
    width: "100%",
    backgroundColor: theme.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.45 },
  btnText: { color: "#1c1526", fontSize: 18, fontWeight: "800" },
});
