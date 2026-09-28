import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { legalPage } from "@/lib/legal";
import { colors } from "@/lib/theme";

export default function LegalScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const page = legalPage(slug);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/settings"));

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.bar}>
        <Pressable onPress={goBack} hitSlop={10} style={styles.back}><Text style={{ fontSize: 18, color: colors.ink }}>←</Text></Pressable>
        <Text style={styles.title} numberOfLines={1}>{page?.title ?? "Informations"}</Text>
        <View style={{ width: 40 }} />
      </View>
      {!page ? <Text style={styles.empty}>Page introuvable.</Text> : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 60 }}>
          <Text style={styles.h1}>{page.title}</Text>
          <Text style={styles.updated}>Mis à jour : {page.updated}</Text>
          {page.sections.map((s) => (
            <View key={s.h} style={{ gap: 8 }}>
              <Text style={styles.h2}>{s.h}</Text>
              {s.p.map((t, i) => <Text key={i} style={styles.p}>{t}</Text>)}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 8 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", color: colors.ink },
  empty: { color: colors.muted, textAlign: "center", marginTop: 60 },
  h1: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5, color: colors.ink },
  updated: { fontSize: 12, color: colors.muted, marginTop: -10 },
  h2: { fontSize: 17, fontWeight: "700", color: colors.ink },
  p: { fontSize: 15, lineHeight: 23, color: "#3D3649" },
});
