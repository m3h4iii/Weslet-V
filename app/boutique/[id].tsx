import { useEffect, useState } from "react";
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ProductCard } from "@/components/ProductCard";
import { GridSkeleton } from "@/components/Skeleton";
import { fetchBrand, fetchBrandProducts } from "@/lib/data";
import { usePrefs } from "@/lib/prefs";
import { shareBoutique } from "@/lib/share";
import { colors, gradient, radius } from "@/lib/theme";
import type { Brand, Product } from "@/lib/types";

export default function BoutiqueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isFollowing, toggleFollow } = usePrefs();
  const [brand, setBrand] = useState<Brand | null | undefined>(undefined);
  const [items, setItems] = useState<Product[] | null>(null);

  useEffect(() => {
    fetchBrand(id).then(setBrand).catch(() => setBrand(null));
    fetchBrandProducts(id).then(setItems).catch(() => setItems([]));
  }, [id]);

  const following = isFollowing(id);
  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)"));

  const header = brand ? (
    <View style={styles.head}>
      <LinearGradient colors={[...gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ring}>
        <View style={styles.avatar}>
          {brand.logoUrl ? (
            <Image source={{ uri: brand.logoUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
          ) : (
            <Text style={styles.letter}>{brand.name[0]?.toUpperCase() ?? "W"}</Text>
          )}
        </View>
      </LinearGradient>
      <Text style={styles.name}>{brand.name}</Text>
      <Text style={styles.meta}>
        {brand.city ?? ""}{brand.instagram ? `${brand.city ? "  ·  " : ""}@${brand.instagram}` : ""}
      </Text>
      {brand.bio ? <Text style={styles.bio}>{brand.bio}</Text> : null}
      <View style={styles.actions}>
        <Pressable
          onPress={() => { toggleFollow(id); Haptics.selectionAsync().catch(() => {}); }}
          style={[styles.follow, following && styles.followOn]}
        >
          <Text style={[styles.followText, following && { color: colors.ink }]}>{following ? "Suivi ✓" : "Suivre"}</Text>
        </Pressable>
        {brand.instagram ? (
          <Pressable onPress={() => Linking.openURL(`https://instagram.com/${brand.instagram}`)} style={styles.secondary}>
            <Text style={styles.secondaryText}>Instagram</Text>
          </Pressable>
        ) : null}
        <Pressable onPress={() => shareBoutique(brand.name, id)} style={styles.secondary}>
          <Text style={styles.secondaryText}>↗</Text>
        </Pressable>
      </View>
      <Text style={styles.count}>{items ? `${items.length} pièce${items.length > 1 ? "s" : ""}` : ""}</Text>
    </View>
  ) : null;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.bar}>
        <Pressable onPress={goBack} hitSlop={10} style={styles.back}><Text style={{ fontSize: 18, color: colors.ink }}>←</Text></Pressable>
        <Text style={styles.title} numberOfLines={1}>{brand?.name ?? "Boutique"}</Text>
        <View style={{ width: 40 }} />
      </View>
      {brand === null ? (
        <Text style={styles.empty}>Boutique introuvable.</Text>
      ) : items === null ? (
        <>{header}<GridSkeleton rows={2} /></>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 12 }}
          contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }}
          ListHeaderComponent={header}
          renderItem={({ item }) => <ProductCard product={item} />}
          ListEmptyComponent={<Text style={styles.empty}>Aucune pièce en ligne pour l'instant.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 8 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", color: colors.ink },
  head: { alignItems: "center", paddingTop: 8, paddingBottom: 18, gap: 6 },
  ring: { width: 92, height: 92, borderRadius: 46, padding: 3 },
  avatar: { flex: 1, borderRadius: 43, backgroundColor: colors.mist, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  letter: { fontSize: 36, fontWeight: "800", color: colors.ink },
  name: { fontSize: 24, fontWeight: "700", letterSpacing: -0.5, color: colors.ink, marginTop: 6 },
  meta: { fontSize: 13, color: colors.muted },
  bio: { fontSize: 14, color: colors.ink, textAlign: "center", lineHeight: 20, paddingHorizontal: 24, marginTop: 4 },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  follow: { paddingHorizontal: 22, height: 40, borderRadius: radius.pill, backgroundColor: colors.ink, alignItems: "center", justifyContent: "center" },
  followOn: { backgroundColor: colors.mist },
  followText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  secondary: { paddingHorizontal: 16, height: 40, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  secondaryText: { color: colors.ink, fontWeight: "600", fontSize: 14 },
  count: { fontSize: 12, color: colors.muted, marginTop: 8 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
});
