import { useEffect, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { fetchProduct, unitsLeft } from "@/lib/data";
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
    fetchProduct(id).then((prod) => {
      setP(prod);
      // Preselect only when there is a single available size; otherwise the buyer must choose.
      const avail = prod ? prod.variants.filter((v) => unitsLeft(prod, v) > 0) : [];
      setVariant(avail.length === 1 ? avail[0] : null);
    });
  }, [id]);

  if (!p) return <View style={{ flex: 1, backgroundColor: colors.white }} />;

  const hasSizes = p.variants.length > 0;
  const soldOut = p.stock <= 0 || (hasSizes && p.variants.every((v) => unitsLeft(p, v) <= 0));
  const needsSize = hasSizes && !variant;
  const canAdd = !soldOut && !needsSize;
  const left = unitsLeft(p, variant);

  const addToBag = () => {
    if (!canAdd) return;
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

          {hasSizes && (
            <View style={{ marginTop: 14 }}>
              <View style={styles.sizeHead}>
                <Text style={styles.sizeLabel}>Taille</Text>
                {variant && left > 0 && left <= 3 ? <Text style={styles.lowStock}>Plus que {left} en stock</Text> : null}
              </View>
              <View style={styles.variants}>
                {p.variants.map((v) => {
                  const out = unitsLeft(p, v) <= 0;
                  const on = variant === v;
                  return (
                    <Pressable
                      key={v}
                      disabled={out}
                      onPress={() => { setVariant(v); Haptics.selectionAsync(); }}
                      style={[styles.variant, on && styles.variantOn, out && styles.variantOut]}
                    >
                      <Text style={[styles.variantText, on && { color: "#fff" }, out && styles.variantTextOut]}>{v}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {p.variants.some((v) => unitsLeft(p, v) <= 0) ? <Text style={styles.sizeHint}>Tailles barrées : épuisées.</Text> : null}
            </View>
          )}
          {!hasSizes && soldOut ? <Text style={styles.soldOut}>Épuisé pour le moment.</Text> : null}

          {p.description ? <Text style={styles.desc}>{p.description}</Text> : null}
        </View>
      </ScrollView>

      <Pressable onPress={() => router.back()} style={[styles.back, { top: insets.top + 8 }]} hitSlop={8}>
        <Text style={{ color: colors.ink, fontSize: 18 }}>←</Text>
      </Pressable>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable onPress={addToBag} disabled={!canAdd} style={[styles.cta, !canAdd && styles.ctaOff]}>
          <Text style={[styles.ctaText, !canAdd && { color: colors.muted }]}>
            {soldOut ? "Épuisé" : needsSize ? "Choisissez une taille" : `Ajouter au panier · ${formatPrice(p.price)}`}
          </Text>
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
  sizeHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sizeLabel: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  lowStock: { fontSize: 12, color: colors.pink, fontWeight: "600" },
  sizeHint: { fontSize: 12, color: colors.muted, marginTop: 8 },
  soldOut: { fontSize: 14, color: colors.pink, fontWeight: "600", marginTop: 12 },
  variants: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  variant: { minWidth: 48, alignItems: "center", paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line },
  variantOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  variantOut: { backgroundColor: colors.mist, borderColor: colors.mist },
  variantText: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  variantTextOut: { color: colors.muted, textDecorationLine: "line-through" },
  desc: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 14 },
  back: { position: "absolute", left: 14, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line },
  cta: { backgroundColor: colors.ink, height: 52, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  ctaOff: { backgroundColor: colors.mist },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
