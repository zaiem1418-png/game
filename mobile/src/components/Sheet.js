import React from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";

// نافذة سفلية مشتركة (تعكس soc-sheet في الويب): خلفية معتمة + بطاقة + رأس.
export default function Sheet({ visible, onClose, title, right, children }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation?.()}>
          <View style={styles.head}>
            <Pressable style={styles.close} onPress={onClose}><Text style={styles.closeTxt}>✕</Text></Pressable>
            <Text style={styles.title}>{title}</Text>
            {right ? <Text style={styles.right}>{right}</Text> : <View style={{ width: 40 }} />}
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#0f2229", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: "88%", paddingBottom: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  head: {
    flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  close: { width: 40 },
  closeTxt: { color: "#9dc0b8", fontSize: 20 },
  title: { color: "#eaf6f3", fontSize: 18, fontWeight: "800", flex: 1, textAlign: "center" },
  right: { color: "#ffce5a", fontSize: 12, fontWeight: "700", minWidth: 40, textAlign: "left" },
});
