import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { colors, radius } from "@/lib/theme";

/**
 * Boutiques | Outlet switch. `onDark` is the translucent version shown over the
 * reels feed; the default is the white-screen version used inside the Outlet.
 */
export function WorldSwitch({ active, onDark = false }: { active: "boutiques" | "outlet"; onDark?: boolean }) {
  const router = useRouter();
  const go = (to: "boutiques" | "outlet") => {
    if (to === active) return;
    Haptics.selectionAsync().catch(() => {});
    if (to === "outlet") router.push("/outlet");
    else if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };
  return (
    <View style={styles.row}>
      {(["boutiques", "outlet"] as const).map((k) => {
        const on = k === active;
        return (
          <Pressable
            key={k}
            onPress={() => go(k)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.chip, onDark ? styles.chipDark : styles.chipLight, on && (onDark ? styles.onDark : styles.onLight)]}
          >
            <Text style={[styles.text, onDark ? { color: "#fff" } : { color: colors.ink }, on && { color: onDark ? colors.ink : "#fff" }]}>
              {k === "boutiques" ? "Boutiques" : "Outlet"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6 },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  chipLight: { borderColor: colors.line, backgroundColor: colors.white },
  chipDark: { borderColor: "rgba(255,255,255,0.35)", backgroundColor: "rgba(255,255,255,0.18)" },
  onLight: { backgroundColor: colors.ink, borderColor: colors.ink },
  onDark: { backgroundColor: "#fff", borderColor: "#fff" },
  text: { fontSize: 13, fontWeight: "700" },
});
