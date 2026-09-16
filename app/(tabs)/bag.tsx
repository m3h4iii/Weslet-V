import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { DELIVERY_FEE } from "@/lib/address";
import { orderTotals } from "@/lib/data";
import { colors, formatPrice, radius } from "@/lib/theme";

export default function BagScreen() {
  const router = useRouter();
  const { lines, setQty, clear } = useCart();
  const { signedIn } = useAuth();
  const { groups, subtotal, delivery, total } = useMemo(() => orderTotals(lines), [lines]);

  const checkout = () => {
    if (!signedIn) router.push({ pathname: "/auth", params: { next: "/checkout" } });
    else router.push("/checkout");
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Text style={styles.title}>Panier</Text>
      {lines.length === 0 ? (
        <View style={{ padding: 16 }}>
          <Text style={styles.empty}>Rien pour l'instant. Glissez dans le fil ou explorez.</Text>
          <Pressable onPress={() => router.push("/(tabs)/explore")} style={styles.secondary}>
            <Text style={styles.secondaryText}>Explorer les pièces</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 170 }}>
          {groups.map((g) => (
            <View key={g.brand.id} style={styles.group}>
              <View style={styles.groupHead}>
                <Text style={styles.groupName}>{g.brand.name}</Text>
                <Text style={styles.groupSub}>{g.brand.city ? `${g.brand.city} · ` : ""}livraison {formatPrice(DELIVERY_FEE)}</Text>
              </View>
              {g.lines.map((item) => (
                <View key={`${item.product.id}:${item.variant ?? ""}`} style={styles.row}>
                  <Pressable onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.product.id } })}>
                    <Image source={{ uri: item.product.images[0] }} style={styles.thumb} contentFit="cover" />
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name} numberOfLines={2}>{item.product.name}</Text>
                    {item.variant ? <Text style={styles.sub}>{item.variant}</Text> : null}
                    <Text style={styles.price}>{formatPrice(item.product.price)}</Text>
                  </View>
                  <View style={styles.qty}>
                    <Pressable onPress={() => setQty(item.product.id, item.variant, item.qty - 1)} style={styles.qtyBtn}><Text style={styles.qtyText}>−</Text></Pressable>
                    <Text style={styles.qtyNum}>{item.qty}</Text>
                    <Pressable onPress={() => setQty(item.product.id, item.variant, item.qty + 1)} style={styles.qtyBtn}><Text style={styles.qtyText}>+</Text></Pressable>
                  </View>
                </View>
              ))}
            </View>
          ))}
          <Pressable onPress={clear} hitSlop={8} style={{ alignSelf: "center" }}><Text style={styles.clear}>Vider le panier</Text></Pressable>
        </ScrollView>
      )}

      {lines.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totals}>
            <Text style={styles.sub}>Sous-total {formatPrice(subtotal)} · Livraison {formatPrice(delivery)}</Text>
            <Text style={styles.total}>{formatPrice(total)}</Text>
          </View>
          <Pressable onPress={checkout} style={styles.cta}>
            <Text style={styles.ctaText}>Commander</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.6, paddingHorizontal: 16, paddingTop: 8, color: colors.ink },
  empty: { color: colors.muted, textAlign: "center", marginTop: 60, marginBottom: 18 },
  secondary: { height: 46, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line },
  secondaryText: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  group: { gap: 14 },
  groupHead: { gap: 2 },
  groupName: { fontSize: 16, fontWeight: "700", color: colors.ink },
  groupSub: { fontSize: 12, color: colors.muted },
  row: { flexDirection: "row", gap: 12, alignItems: "center" },
  thumb: { width: 72, height: 96, borderRadius: radius.sm, backgroundColor: colors.mist },
  name: { fontSize: 15, fontWeight: "600", color: colors.ink },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  price: { fontSize: 14, fontWeight: "600", color: colors.ink, marginTop: 6 },
  qty: { flexDirection: "row", alignItems: "center", gap: 6 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 18, color: colors.ink },
  qtyNum: { minWidth: 20, textAlign: "center", fontSize: 15, color: colors.ink },
  clear: { color: colors.muted, fontSize: 14 },
  footer: {
    position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 20, gap: 14,
    flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line,
  },
  totals: { flex: 1 },
  total: { fontSize: 22, fontWeight: "700", color: colors.ink, marginTop: 2 },
  cta: { backgroundColor: colors.ink, paddingHorizontal: 24, paddingVertical: 15, borderRadius: radius.pill },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
