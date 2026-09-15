import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { gradient } from "@/lib/theme";

export function LogoMark({ size = 28, light = false }: { size?: number; light?: boolean }) {
  return (
    <View style={{ width: size, height: size }}>
      <LinearGradient colors={[...gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.mark, { borderRadius: size * 0.3 }]}>
        <Text style={[styles.w, { fontSize: size * 0.55 }]}>W</Text>
      </LinearGradient>
      <View style={[styles.spark, { width: size * 0.32, height: size * 0.32, top: -size * 0.12, right: -size * 0.12 }]}>
        <Text style={{ color: "#FFB020", fontSize: size * 0.32, lineHeight: size * 0.34 }}>✦</Text>
      </View>
      {light ? null : null}
    </View>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <LogoMark size={26} />
      <Text style={{ fontSize: 19, fontWeight: "700", letterSpacing: -0.4, color: light ? "#fff" : "#17121F" }}>weslet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { flex: 1, alignItems: "center", justifyContent: "center" },
  w: { color: "#fff", fontWeight: "800" },
  spark: { position: "absolute", alignItems: "center", justifyContent: "center" },
});
