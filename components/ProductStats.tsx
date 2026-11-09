import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { fetchProductStats, isPopular, type ProductStats as Stats } from "@/lib/stats";
import { colors, radius } from "@/lib/theme";

/** Small line of social proof under the price. Only shows numbers that are worth showing (never "0 vendus"). */
export function ProductStats({ productId }: { productId: string }) {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    let alive = true;
    fetchProductStats([productId]).then((r) => alive && setS(r[productId] ?? null)).catch(() => {});
    return () => { alive = false; };
  }, [productId]);

  if (!s) return null;

  const chips: string[] = [];
  if (s.viewingNow >= 2) chips.push(`👀 ${s.viewingNow} personnes regardent`);
  else if (s.viewers7d >= 5) chips.push(`👀 ${s.viewers7d} vues cette semaine`);
  if (s.sold >= 1) chips.push(`🛍️ ${s.sold} vendu${s.sold > 1 ? "s" : ""}`);
  if (s.favorites >= 1) chips.push(`♥ ${s.favorites} en favori${s.favorites > 1 ? "s" : ""}`);

  if (chips.length === 0 && !isPopular(s)) return null;

  return (
    <View style={styles.row}>
      {isPopular(s) ? (
        <View style={[styles.chip, styles.hot]}><Text style={styles.hotText}>🔥 Populaire</Text></View>
      ) : null}
      {chips.map((c) => (
        <View key={c} style={styles.chip}><Text style={styles.chipText}>{c}</Text></View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  chip: { backgroundColor: colors.mist, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontSize: 12, color: colors.ink, fontWeight: "600" },
  hot: { backgroundColor: "#FFF1E0" },
  hotText: { fontSize: 12, color: "#B45309", fontWeight: "700" },
});
