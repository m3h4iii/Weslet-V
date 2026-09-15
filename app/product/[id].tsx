import { useEffect, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { fetchProduct } from "@/lib/data";
import { useCart } from "@/lib/cart";
import { colors, formatPrice, radius } from "@/lib/theme";
import type { Product } from "@/lib/types";

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { add } = useCart();
  const [p, setP] = useState<Product | null>(null);
  const [variant, setVariant] = useState<string | null>(null);

  useEffect(() => {
    fetchProduct(id).then((prod) => { setP(prod); setVariant(prod?.variants[0] ?? null); });
  }, [id]);

  if (!p) return <View style={{ flex: 1, backgroundColor: colors.white }} />;

  const addToBag = () => {
    add(p, variant);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <FlatList
          data={p.images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(u, i) => `${i}-${u}`}
          renderItem={({ item }) => <Image source={{ uri: item }} style={{ width, height: width * 1.3 }} contentFit="cover" />}
        />
        <View style={styles.body}>
          <Text style={styles.brand}>{p.brand.name}{p.brand.city ? ` · ${p.brand.city}` : ""}</Text>
          <Text style={styles.name}>{p.name}</Text>
          <Text style={styles.price}>{formatPrice(p.price)}</Text>

          {p.variants.length > 0 && (
            <View style={styles.variants}>
              {p.variants.map((v) => (
                <Pressable key={v} onPress={() => setVariant(v)} style={[styles.variant, variant === v && styles.variantOn]}>
                  <Text style={[styles.variantText, variant === v && { color: "#fff" }]}>{v}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {p.description ? <Text style={styles.desc}>{p.description}</Text> : null}
        </View>
      </ScrollView>

      <Pressable onPress={() => router.back()} style={[styles.back, { top: insets.top + 8 }]} hitSlop={8}>
        <Text style={{ color: colors.ink, fontSize: 18 }}>←</Text>
      </Pressable>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable onPress={addToBag} style={styles.cta}>
          <Text style={styles.ctaText}>Ajouter au panier · {formatPrice(p.price)}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 18, gap: 6 },
  brand: { color: colors.muted, fontSize: 14 },
  name: { color: colors.ink, fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
  price: { color: colors.ink, fontSize: 17 },
  variants: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  variant: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line },
  variantOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  variantText: { color: colors.ink, fontSize: 14 },
  desc: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 14 },
  back: { position: "absolute", left: 14, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line },
  cta: { backgroundColor: colors.ink, height: 52, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
