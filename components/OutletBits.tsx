import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "@/lib/theme";

/** Re-renders every `ms` so live prices and countdowns move. */
export function useNow(ms = 250) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function stockLabel(n: number) {
  if (n <= 0) return "Épuisé";
  if (n <= 2) return `Plus que ${n} !`;
  return `${n} pièces restantes`;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.round(value * 1000) / 10}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 4, borderRadius: 2, backgroundColor: colors.mist, overflow: "hidden" },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.pink },
});
