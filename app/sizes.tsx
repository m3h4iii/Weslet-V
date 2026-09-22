import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SIZE_GROUPS, usePrefs } from "@/lib/prefs";
import { colors, radius } from "@/lib/theme";

export default function SizesScreen() {
  const router = useRouter();
  const { sizes, setSizes, setSizeFilter } = usePrefs();
  const [picked, setPicked] = useState<string[]>(sizes);

  const toggle = (s: string) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  const done = () => {
    setSizes(picked);
    if (picked.length > 0) setSizeFilter(true);
    router.canGoBack() ? router.back() : router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 22, paddingBottom: 120 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.h1}>Mes tailles</Text>
          <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))} hitSlop={10}><Text style={styles.close}>✕</Text></Pressable>
        </View>
        <Text style={styles.p}>Choisissez toutes les tailles qui vous vont. Le fil ne montrera que les pièces disponibles dans vos tailles ; les accessoires taille unique restent visibles.</Text>

        {SIZE_GROUPS.map((g) => (
          <View key={g.label} style={{ gap: 10 }}>
            <Text style={styles.label}>{g.label}</Text>
            <View style={styles.grid}>
              {g.sizes.map((s) => {
                const on = picked.includes(s);
                return (
                  <Pressable key={s} onPress={() => toggle(s)} style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[styles.chipText, on && { color: "#fff" }]}>{s}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {picked.length > 0 ? (
          <Pressable onPress={() => setPicked([])} hitSlop={8}><Text style={styles.clear}>Tout désélectionner</Text></Pressable>
        ) : null}
      </ScrollView>
      <View style={styles.footer}>
        <Pressable onPress={done} style={styles.cta}>
          <Text style={styles.ctaText}>{picked.length > 0 ? `Enregistrer (${picked.length})` : "Continuer sans filtre"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  h1: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5, color: colors.ink },
  close: { fontSize: 18, color: colors.muted },
  p: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  label: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minWidth: 54, alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 15, fontWeight: "600", color: colors.ink },
  clear: { color: colors.violet, fontSize: 14, fontWeight: "600" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 28, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line },
  cta: { backgroundColor: colors.ink, height: 52, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
