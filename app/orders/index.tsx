import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { fetchMyOrders } from "@/lib/data";
import { STATUS_LABEL, formatDate, statusTone } from "@/lib/orders";
import { colors, formatPrice, radius } from "@/lib/theme";
import type { Order } from "@/lib/types";

export default function OrdersScreen() {
  const router = useRouter();
  const { placed } = useLocalSearchParams<{ placed?: string }>();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useFocusEffect(useCallback(() => {
    let alive = true;
    fetchMyOrders().then((o) => alive && setOrders(o)).catch(() => alive && setOrders([]));
    return () => { alive = false; };
  }, []));

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/profile"))} hitSlop={10} style={styles.back}>
          <Text style={{ fontSize: 18, color: colors.ink }}>←</Text>
        </Pressable>
        <Text style={styles.title}>Mes commandes</Text>
        <View style={{ width: 40 }} />
      </View>

      {placed ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>✓ {placed} commandes passées. Chaque boutique livre séparément.</Text>
        </View>
      ) : null}

      {orders === null ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.ink} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          ListEmptyComponent={<Text style={styles.empty}>Aucune commande pour l'instant.</Text>}
          renderItem={({ item }) => {
            const tone = statusTone(item.status);
            return (
              <Pressable onPress={() => router.push({ pathname: "/orders/[id]", params: { id: item.id } })} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.number}>{item.number}</Text>
                  <View style={[styles.pill, { backgroundColor: tone.bg }]}>
                    <Text style={[styles.pillText, { color: tone.fg }]}>{STATUS_LABEL[item.status] ?? item.status}</Text>
                  </View>
                </View>
                <Text style={styles.merchant}>{item.merchant.name}</Text>
                <Text style={styles.items} numberOfLines={2}>
                  {item.items.map((i) => `${i.qty} × ${i.title}${i.variant ? ` (${i.variant})` : ""}`).join(", ")}
                </Text>
                <View style={styles.cardBottom}>
                  <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                  <Text style={styles.total}>{formatPrice(item.total)}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 8 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700", color: colors.ink },
  banner: { marginHorizontal: 16, padding: 12, borderRadius: radius.md, backgroundColor: "#E6F5EC" },
  bannerText: { color: "#0F7A3D", fontSize: 13, fontWeight: "600" },
  empty: { color: colors.muted, textAlign: "center", marginTop: 60 },
  card: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.mist, gap: 6 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  number: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  pillText: { fontSize: 12, fontWeight: "700" },
  merchant: { fontSize: 16, fontWeight: "700", color: colors.ink },
  items: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  date: { fontSize: 13, color: colors.muted },
  total: { fontSize: 15, fontWeight: "700", color: colors.ink },
});
