import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Wordmark } from "@/components/Logo";
import { WorldSwitch } from "@/components/WorldSwitch";
import { Skeleton } from "@/components/Skeleton";
import { ProgressBar, stockLabel, useNow } from "@/components/OutletBits";
import { colors, formatPrice, radius } from "@/lib/theme";
import {
  clockTime, dropDiscountText, dropPrice, dropProgress, dropState, fetchOutletDrops, formatLivePrice,
  mmss, subscribeOutlet, unitsAvailable, type OutletDrop,
} from "@/lib/outlet";

export default function OutletScreen() {
  const router = useRouter();
  const now = useNow();
  const [drops, setDrops] = useState<OutletDrop[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reminders, setReminders] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    try { setDrops(await fetchOutletDrops()); } catch { setDrops((d) => d ?? []); }
  }, []);

  useEffect(() => { load(); return subscribeOutlet(load); }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const live = drops?.find((d) => dropState(d, now) === "live") ?? null;
  const upcoming = (drops ?? []).filter((d) => dropState(d, now) === "upcoming").slice(0, 6);
  const ended = (drops ?? []).filter((d) => dropState(d, now) === "ended" && d.startsAt > now - 3 * 3600_000).reverse().slice(0, 5);
  const next = upcoming[0] ?? null;

  const open = (d: OutletDrop) => router.push({ pathname: "/outlet/[id]", params: { id: d.id } });

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Wordmark />
        <WorldSwitch active="outlet" />
      </View>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 20, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.ink} colors={[colors.pink]} />}
      >
        <View>
          <Text style={styles.title}>Outlet</Text>
          <Text style={styles.sub}>Fins de saison des boutiques. Le prix baisse chaque seconde.</Text>
        </View>

        {drops === null ? (
          <Skeleton style={{ height: 420, borderRadius: radius.md }} />
        ) : live ? (
          <View style={{ gap: 12 }}>
            <View style={styles.liveHead}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>En direct</Text>
              </View>
              <Text style={styles.meta}>Fin dans <Text style={{ color: colors.ink, fontWeight: "700" }}>{mmss((live.startsAt + live.durationSec * 1000 - now) / 1000)}</Text></Text>
            </View>

            <Pressable onPress={() => open(live)} style={{ gap: 10 }} accessibilityRole="button" accessibilityLabel={`Voir ${live.product.name}`}>
              <View>
                <Image source={{ uri: live.product.images[0] }} style={styles.hero} contentFit="cover" transition={200} />
                <View style={[styles.badge, { left: 12 }]}><Text style={styles.badgeText}>{stockLabel(unitsAvailable(live))}</Text></View>
                <View style={[styles.badge, styles.badgePink, { right: 12 }]}><Text style={[styles.badgeText, { color: "#fff" }]}>{dropDiscountText(live, now)}</Text></View>
              </View>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>{live.product.name}</Text>
                  <Text style={styles.brand} numberOfLines={1}>{live.product.brand.name}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.livePrice}>{formatLivePrice(dropPrice(live, now))}</Text>
                  <Text style={styles.strike}>{formatPrice(live.startPrice)}</Text>
                </View>
              </View>
              <ProgressBar value={dropProgress(live, now)} />
            </Pressable>

            <Pressable onPress={() => open(live)} style={styles.cta}>
              <Text style={styles.ctaText}>Acheter à {formatLivePrice(dropPrice(live, now))}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.nextCard}>
            <Text style={styles.meta}>{next ? "Prochain drop dans" : "Plus de drops pour aujourd'hui"}</Text>
            {next ? (
              <>
                <Text style={styles.nextCount}>{mmss((next.startsAt - now) / 1000)}</Text>
                <Text style={styles.meta}>{next.product.name} · {next.product.brand.name}</Text>
              </>
            ) : <Text style={styles.meta}>Revenez demain soir.</Text>}
          </View>
        )}

        {upcoming.length > 0 && (
          <View style={{ gap: 10 }}>
            <Text style={styles.section}>Ensuite</Text>
            {upcoming.map((d) => {
              const on = !!reminders[d.id];
              return (
                <View key={d.id} style={styles.row}>
                  <Pressable onPress={() => open(d)} style={{ flexDirection: "row", gap: 12, flex: 1, alignItems: "center" }}>
                    <Image source={{ uri: d.product.images[0] }} style={styles.thumb} contentFit="cover" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowName} numberOfLines={1}>{d.product.name}</Text>
                      <Text style={styles.brand} numberOfLines={1}>{d.product.brand.name} · départ {formatPrice(d.startPrice)}</Text>
                      <Text style={styles.rowTime}>{clockTime(d.startsAt)} · dans {mmss((d.startsAt - now) / 1000)}</Text>
                    </View>
                  </Pressable>
                  <Pressable
                    onPress={() => { setReminders((r) => ({ ...r, [d.id]: !on })); Haptics.selectionAsync().catch(() => {}); }}
                    style={[styles.remind, on && styles.remindOn]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.remindText, on && { color: "#fff" }]}>{on ? "Rappel ✓" : "Rappel"}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}

        {ended.length > 0 && (
          <View style={{ gap: 4 }}>
            <Text style={styles.section}>Terminés</Text>
            {ended.map((d) => (
              <Text key={d.id} style={styles.meta} numberOfLines={1}>
                {d.product.name} · {d.product.brand.name} · {unitsAvailable(d) <= 0 ? "épuisé" : `${d.taken} vendue${d.taken > 1 ? "s" : ""}`}
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5, color: colors.ink },
  sub: { fontSize: 14, color: colors.muted, marginTop: 2 },
  liveHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.pink },
  liveText: { fontSize: 13, fontWeight: "700", color: colors.pink },
  meta: { fontSize: 13, color: colors.muted },
  hero: { width: "100%", aspectRatio: 1 / 1.05, borderRadius: radius.md, backgroundColor: colors.mist },
  badge: { position: "absolute", top: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: "rgba(255,255,255,0.92)" },
  badgePink: { backgroundColor: colors.pink },
  badgeText: { fontSize: 12, fontWeight: "700", color: colors.ink },
  name: { fontSize: 16, fontWeight: "600", color: colors.ink },
  brand: { fontSize: 13, color: colors.muted, marginTop: 1 },
  livePrice: { fontSize: 22, fontWeight: "700", letterSpacing: -0.3, color: colors.ink, fontVariant: ["tabular-nums"] },
  strike: { fontSize: 13, color: colors.muted, textDecorationLine: "line-through" },
  cta: { backgroundColor: colors.ink, height: 52, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16, fontVariant: ["tabular-nums"] },
  nextCard: { borderRadius: radius.md, backgroundColor: colors.mist, padding: 22, gap: 4 },
  nextCount: { fontSize: 34, fontWeight: "700", letterSpacing: -0.5, color: colors.ink, fontVariant: ["tabular-nums"] },
  section: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  thumb: { width: 54, height: 72, borderRadius: radius.sm, backgroundColor: colors.mist },
  rowName: { fontSize: 14, fontWeight: "600", color: colors.ink },
  rowTime: { fontSize: 12, fontWeight: "600", color: colors.ink, marginTop: 3, fontVariant: ["tabular-nums"] },
  remind: { height: 36, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  remindOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  remindText: { fontSize: 13, fontWeight: "600", color: colors.ink },
});
