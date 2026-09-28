import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { usePrefs } from "@/lib/prefs";
import { TERMS_VERSION } from "@/lib/legal";
import { colors, radius } from "@/lib/theme";

/**
 * One-time acceptance banner (web and first app open). Signed-in users also
 * accept at account creation; this covers browsing without an account.
 */
export function TermsGate() {
  const router = useRouter();
  const { ready, termsAccepted, setTermsAccepted } = usePrefs();
  if (!ready || termsAccepted === TERMS_VERSION) return null;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.sheet}>
        <Text style={styles.title}>Bienvenue sur Weslet</Text>
        <Text style={styles.text}>
          En continuant, vous acceptez les{" "}
          <Text style={styles.link} onPress={() => router.push({ pathname: "/legal/[slug]", params: { slug: "cgu" } })}>conditions d'utilisation</Text>
          {", la "}
          <Text style={styles.link} onPress={() => router.push({ pathname: "/legal/[slug]", params: { slug: "confidentialite" } })}>politique de confidentialité</Text>
          {" et les "}
          <Text style={styles.link} onPress={() => router.push({ pathname: "/legal/[slug]", params: { slug: "regles" } })}>règles de la communauté</Text>.
        </Text>
        <Pressable onPress={() => setTermsAccepted(TERMS_VERSION)} style={styles.btn}>
          <Text style={styles.btnText}>J'accepte</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, bottom: 0, top: 0, justifyContent: "flex-end", backgroundColor: "rgba(23,18,31,0.45)" },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: Platform.OS === "ios" ? 36 : 24, gap: 12 },
  title: { fontSize: 20, fontWeight: "800", color: colors.ink },
  text: { fontSize: 14, lineHeight: 21, color: "#3D3649" },
  link: { color: colors.violet, fontWeight: "600", textDecorationLine: "underline" },
  btn: { backgroundColor: colors.ink, height: 50, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", marginTop: 4 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
