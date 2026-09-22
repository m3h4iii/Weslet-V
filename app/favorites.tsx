import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { fetchProductsByIds } from "@/lib/data";
import { usePrefs } from "@/lib/prefs";
import { colors, formatPrice, radius } from "@/lib/theme";
import type { Product } from "@/lib/types";

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, toggleFavorite } = usePrefs();
  const [live, setLive] = useState<Map<string, Product>>(new Map());

  // Snapshots render instantly; live data refreshes price / stock behind them.
  useEffect(() => {
    fetchProductsByIds(favorites.map((f) => f.id)).then((ps) => setLive(new Map(ps.map((p) => [p.id, p])))).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites.length]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/profile"));

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.bar}>
        <Pressable onPress={goBack} hitSlop={10} style={styles.back}><Text style={{ fontSize: 18, color: colors.ink }}>←</Text></Pressable>
        <Text style={styles.title}>Favoris</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={favorites}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60, gap: 14 }}>
            <Text style={styles.empty}>Aucun favori. Touchez ♡ sur une pièce, ou tapez deux fois sur la photo.</Text>
            <Pressable onPress={() => router.replace("/(tabs)")} style={styles.cta}><Text style={styles.ctaText}>Voir le fil</Text></Pressable>
          </View>
        }
        renderItem={({ item }) => {
          const p = live.get(item.id);
          const price = p?.price ?? item.price;
          const dropped = p && p.price < item.price;
          const gone = p ? p.stock <= 0 : false;
          return (
            <Pressable onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.id } })} style={styles.row}>
              <Image source={{ uri: p?.images[0] ?? item.image ?? undefined }} style={styles.thumb} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={2}>{p?.name ?? item.name}</Text>
                <Text style={styles.sub}>{p?.brand.name ?? item.brand}</Text>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 6 }}>
                  <Text style={[styles.price, dropped && { color: colors.pink }]}>{formatPrice(price)}</Text>
                  {dropped ? <Text style={styles.was}>{formatPrice(item.price)}</Text> : null}
                </View>
                {gone ? <Text style={styles.gone}>Épuisé</Text> : dropped ? <Text style={styles.drop}>Prix baissé ↓</Text> : null}
              </View>
              <Pressable onPress={() => p ? toggleFavorite(p) : toggleFavorite({ id: item.id, name: item.name, price: item.price, images: item.image ? [item.image] : [], brand: { id: "", name: item.brand, slug: "", city: null, logoUrl: null, instagram: null, bio: null }, compareAt: null, stock: 0, description: null, videoUrl: null, category: null, variants: [], variantIds: {}, variantStock: {} })} hitSlop={10} style={styles.heart}>
                <Text style={{ color: colors.pink, fontSize: 20 }}>♥</Text>
              </Pressable>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 8 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700", color: colors.ink },
  empty: { color: colors.muted, textAlign: "center", paddingHorizontal: 30, lineHeight: 20 },
  cta: { backgroundColor: colors.ink, paddingHorizontal: 22, paddingVertical: 12, borderRadius: radius.pill },
  ctaText: { color: "#fff", fontWeight: "700" },
  row: { flexDirection: "row", gap: 12, alignItems: "center" },
  thumb: { width: 72, height: 96, borderRadius: radius.sm, backgroundColor: colors.mist },
  name: { fontSize: 15, fontWeight: "600", color: colors.ink },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  price: { fontSize: 14, fontWeight: "600", color: colors.ink },
  was: { fontSize: 12, color: colors.muted, textDecorationLine: "line-through" },
  drop: { fontSize: 12, color: colors.pink, fontWeight: "600", marginTop: 2 },
  gone: { fontSize: 12, color: colors.muted, marginTop: 2 },
  heart: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
});
