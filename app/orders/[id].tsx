import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fetchOrder, subscribeOrder } from "@/lib/data";
import { STATUS_DESC, STATUS_LABEL, TIMELINE, formatDate, isTerminalFailure, statusTone } from "@/lib/orders";
import { colors, formatPrice, radius } from "@/lib/theme";
import type { Order, OrderStatus } from "@/lib/types";

export default function OrderScreen() {
  const router = useRouter();
  const { id, placed } = useLocalSearchParams<{ id: string; placed?: string }>();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  const load = useCallback(() => { fetchOrder(id).then(setOrder).catch(() => setOrder(null)); }, [id]);

  useEffect(() => {
    load();
    return subscribeOrder(id, load);
  }, [id, load]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/orders"));

  if (order === undefined) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <Header onBack={goBack} title="Commande" />
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.ink} />
      </SafeAreaView>
    );
  }
  if (!order) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <Header onBack={goBack} title="Commande" />
        <Text style={styles.empty}>Commande introuvable.</Text>
      </SafeAreaView>
    );
  }

  const tone = statusTone(order.status);
  const failed = isTerminalFailure(order.status);
  const reached = TIMELINE.indexOf(order.status);
  const eventTime = (s: OrderStatus) => order.events.find((e) => e.status === s)?.at;

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Header onBack={goBack} title={order.number || "Commande"} />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 48 }}>
        {placed ? (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>✓ Commande envoyée</Text>
            <Text style={styles.bannerText}>{order.merchant.name} va vous confirmer. Paiement à la livraison : {formatPrice(order.total)}.</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View style={[styles.pill, { backgroundColor: tone.bg }]}>
              <Text style={[styles.pillText, { color: tone.fg }]}>{STATUS_LABEL[order.status] ?? order.status}</Text>
            </View>
            <Text style={styles.muted}>{formatDate(order.createdAt)}</Text>
          </View>
          <Text style={styles.desc}>{STATUS_DESC[order.status] ?? ""}</Text>

          {!failed && (
            <View style={styles.timeline}>
              {TIMELINE.map((s, i) => {
                const done = i <= reached;
                const current = i === reached;
                return (
                  <View key={s} style={styles.step}>
                    <View style={styles.stepRail}>
                      <View style={[styles.dot, done && styles.dotOn, current && styles.dotNow]} />
                      {i < TIMELINE.length - 1 && <View style={[styles.rail, i < reached && styles.railOn]} />}
                    </View>
                    <View style={{ flex: 1, paddingBottom: 14 }}>
                      <Text style={[styles.stepLabel, done && styles.stepLabelOn]}>{STATUS_LABEL[s]}</Text>
                      {eventTime(s) ? <Text style={styles.stepTime}>{formatDate(eventTime(s)!)}</Text> : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {(order.courier || order.tracking) && (
            <View style={styles.tracking}>
              <Text style={styles.trackingLabel}>Livreur</Text>
              <Text style={styles.trackingValue}>{order.courier ?? "—"}</Text>
              {order.tracking ? (
                <>
                  <Text style={[styles.trackingLabel, { marginTop: 8 }]}>N° de suivi</Text>
                  <Text style={[styles.trackingValue, { fontVariant: ["tabular-nums"] }]} selectable>{order.tracking}</Text>
                </>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}>{order.merchant.name}</Text>
          {order.items.map((it, i) => (
            <View key={i} style={styles.line}>
              <Text style={styles.lineName}>{it.qty} × {it.title}{it.variant ? ` · ${it.variant}` : ""}</Text>
              <Text style={styles.lineTotal}>{formatPrice(it.lineTotal)}</Text>
            </View>
          ))}
          <View style={styles.sep} />
          <Row label="Sous-total" value={formatPrice(order.subtotal)} />
          <Row label="Livraison" value={formatPrice(order.delivery)} />
          <Row label="Total (espèces à la livraison)" value={formatPrice(order.total)} bold />
        </View>

        <View style={styles.card}>
          <Text style={styles.h2}>Livraison à</Text>
          <Text style={styles.addr}>{order.address.recipientName}</Text>
          <Text style={styles.addrMuted}>{order.address.phone}</Text>
          <Text style={styles.addr}>{order.address.addressLine}</Text>
          <Text style={styles.addrMuted}>{order.address.city}, {order.address.governorate}</Text>
          {order.address.notes ? <Text style={styles.addrMuted}>« {order.address.notes} »</Text> : null}
        </View>

        {order.events.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.h2}>Historique</Text>
            {[...order.events].reverse().map((e, i) => (
              <View key={i} style={styles.event}>
                <Text style={styles.eventStatus}>{STATUS_LABEL[e.status as OrderStatus] ?? e.status}</Text>
                <Text style={styles.eventTime}>{formatDate(e.at)}</Text>
                {e.note ? <Text style={styles.eventNote}>{e.note}</Text> : null}
              </View>
            ))}
          </View>
        )}

        <Pressable onPress={() => router.replace("/(tabs)")} style={styles.secondary}>
          <Text style={styles.secondaryText}>Continuer mes achats</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.back}><Text style={{ fontSize: 18, color: colors.ink }}>←</Text></Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.rowBold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.rowBold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 8 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700", color: colors.ink },
  empty: { color: colors.muted, textAlign: "center", marginTop: 60 },
  banner: { padding: 14, borderRadius: radius.lg, backgroundColor: "#E6F5EC", gap: 4 },
  bannerTitle: { color: "#0F7A3D", fontSize: 16, fontWeight: "700" },
  bannerText: { color: "#0F7A3D", fontSize: 13, lineHeight: 19 },
  card: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.mist, gap: 8 },
  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill },
  pillText: { fontSize: 13, fontWeight: "700" },
  muted: { fontSize: 13, color: colors.muted },
  desc: { fontSize: 14, color: colors.ink, lineHeight: 20 },
  timeline: { marginTop: 10 },
  step: { flexDirection: "row", gap: 12 },
  stepRail: { width: 16, alignItems: "center" },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#fff", borderWidth: 2, borderColor: colors.line, marginTop: 3 },
  dotOn: { backgroundColor: colors.violet, borderColor: colors.violet },
  dotNow: { backgroundColor: colors.pink, borderColor: colors.pink },
  rail: { flex: 1, width: 2, backgroundColor: colors.line, marginVertical: 2 },
  railOn: { backgroundColor: colors.violet },
  stepLabel: { fontSize: 14, color: colors.muted },
  stepLabelOn: { color: colors.ink, fontWeight: "600" },
  stepTime: { fontSize: 12, color: colors.muted, marginTop: 1 },
  tracking: { marginTop: 6, padding: 12, borderRadius: radius.md, backgroundColor: "#fff" },
  trackingLabel: { fontSize: 12, color: colors.muted, fontWeight: "600" },
  trackingValue: { fontSize: 15, color: colors.ink, fontWeight: "600" },
  h2: { fontSize: 17, fontWeight: "700", color: colors.ink, letterSpacing: -0.3, marginBottom: 2 },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  lineName: { flex: 1, fontSize: 14, color: colors.ink },
  lineTotal: { fontSize: 14, color: colors.ink },
  sep: { height: 1, backgroundColor: colors.line, marginVertical: 4 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { fontSize: 14, color: colors.muted },
  rowValue: { fontSize: 14, color: colors.ink },
  rowBold: { fontSize: 16, fontWeight: "700", color: colors.ink },
  addr: { fontSize: 15, color: colors.ink },
  addrMuted: { fontSize: 14, color: colors.muted },
  event: { paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.line },
  eventStatus: { fontSize: 14, fontWeight: "600", color: colors.ink },
  eventTime: { fontSize: 12, color: colors.muted },
  eventNote: { fontSize: 13, color: colors.muted, marginTop: 2 },
  secondary: { height: 48, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line },
  secondaryText: { color: colors.ink, fontSize: 15, fontWeight: "600" },
});
