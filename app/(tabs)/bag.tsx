import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useCart } from "@/lib/cart";
import { colors, formatPrice, radius } from "@/lib/theme";

export default function BagScreen() {
  const { lines, total, setQty, clear } = useCart();

  const checkout = () => {
    // Wired to the existing orders tables once the schema is mapped (lib/data.ts).
    Alert.alert("Commande", "Le paiement à la livraison sera branché sur vos tables Supabase existantes.");
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Text style={styles.title}>Panier</Text>
      <FlatList
        data={lines}
        keyExtractor={(l) => `${l.product.id}:${l.variant ?? ""}`}
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 140 }}
        ListEmptyComponent={<Text style={styles.empty}>Rien pour l'instant. Glissez dans le fil ou explorez.</Text>}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Image source={{ uri: item.product.images[0] }} style={styles.thumb} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.product.name}</Text>
              <Text style={styles.sub}>{item.product.brand.name}{item.variant ? ` · ${item.variant}` : ""}</Text>
              <Text style={styles.price}>{formatPrice(item.product.price)}</Text>
            </View>
            <View style={styles.qty}>
              <Pressable onPress={() => setQty(item.product.id, item.variant, item.qty - 1)} style={styles.qtyBtn}><Text style={styles.qtyText}>−</Text></Pressable>
              <Text style={styles.qtyNum}>{item.qty}</Text>
              <Pressable onPress={() => setQty(item.product.id, item.variant, item.qty + 1)} style={styles.qtyBtn}><Text style={styles.qtyText}>+</Text></Pressable>
            </View>
          </View>
        )}
      />
      {lines.length > 0 && (
        <View style={styles.footer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sub}>Total</Text>
            <Text style={styles.total}>{formatPrice(total)}</Text>
          </View>
          <Pressable onPress={clear} hitSlop={8}><Text style={styles.clear}>Vider</Text></Pressable>
          <Pressable onPress={checkout} style={styles.cta}><Text style={styles.ctaText}>Commander</Text></Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.6, paddingHorizontal: 16, paddingTop: 8, color: colors.ink },
  empty: { color: colors.muted, textAlign: "center", marginTop: 60 },
  row: { flexDirection: "row", gap: 12, alignItems: "center" },
  thumb: { width: 72, height: 96, borderRadius: radius.sm, backgroundColor: colors.mist },
  name: { fontSize: 15, fontWeight: "600", color: colors.ink },
  sub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  price: { fontSize: 14, fontWeight: "600", color: colors.ink, marginTop: 6 },
  qty: { flexDirection: "row", alignItems: "center", gap: 6 },
  qtyBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 18, color: colors.ink },
  qtyNum: { minWidth: 20, textAlign: "center", fontSize: 15, color: colors.ink },
  footer: {
    position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 20, gap: 14,
    flexDirection: "row", alignItems: "center", backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line,
  },
  total: { fontSize: 22, fontWeight: "700", color: colors.ink },
  clear: { color: colors.muted, fontSize: 14 },
  cta: { backgroundColor: colors.ink, paddingHorizontal: 22, paddingVertical: 14, borderRadius: radius.pill },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
