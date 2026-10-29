import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/lib/auth";
import { IS_MOCK } from "@/lib/data";
import { colors, formatPrice, radius } from "@/lib/theme";
import { ProgressBar, stockLabel, useNow } from "@/components/OutletBits";
import {
  cancelOutletLock, dropDiscountText, dropPrice, dropProgress, dropState, fetchOutletDrops, formatLivePrice,
  lockOutletPrice, mmss, subscribeOutlet, unitsAvailable, type OutletDrop, type OutletLock,
} from "@/lib/outlet";

export default function OutletItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { signedIn } = useAuth();
  const now = useNow();
  const [drop, setDrop] = useState<OutletDrop | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [lock, setLock] = useState<OutletLock | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const load = () => fetchOutletDrops().then((all) => setDrop(all.find((d) => d.id === id) ?? null)).catch(() => {});
    load();
    return subscribeOutlet(load);
  }, [id]);

  useEffect(() => {
    if (drop && drop.product.variants.length === 1) setSize(drop.product.variants[0]);
  }, [drop?.id]);

  if (!drop) return <View style={{ flex: 1, backgroundColor: colors.white }} />;

  const p = drop.product;
  const state = dropState(drop, now);
  const left = unitsAvailable(drop);
  const hasSizes = p.variants.length > 0;
  const needsSize = hasSizes && !size;
  const lockLeft = lock ? (lock.expiresAt - now) / 1000 : 0;
  const back = () => (router.canGoBack() ? router.back() : router.replace("/outlet"));

  const onLock = async () => {
    if (state !== "live" || needsSize || busy) return;
    if (!signedIn) { router.push({ pathname: "/auth", params: { next: `/outlet/${drop.id}` } }); return; }
    setBusy(true); setError(null);
    try {
      setLock(await lockOutletPrice(drop, size));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e: any) {
      setError(e?.message ?? "Impossible de bloquer le prix.");
    }
    setBusy(false);
  };

  const onCancel = async () => {
    if (lock) await cancelOutletLock(lock).catch(() => {});
    setLock(null);
  };

  const onPay = () => {
    // Konnect is not connected yet: the demo confirms directly; real mode says so.
    if (IS_MOCK) { setPaid(true); return; }
    setError("Le paiement Konnect arrive bientôt. Votre prix reste bloqué jusqu'à la fin du compte à rebours.");
  };

  // ---------- paid ----------
  if (paid && lock) {
    return (
      <View style={[styles.screen, { padding: 20, justifyContent: "center", gap: 12 }]}>
        <Text style={styles.name}>Commande confirmée</Text>
        <Text style={styles.body}>{p.name}{lock.size ? ` · ${lock.size}` : ""} payé {formatLivePrice(lock.price)} (+ frais de service). Suivez la livraison dans Mes commandes.</Text>
        <Pressable onPress={() => router.replace("/outlet")} style={styles.cta}><Text style={styles.ctaText}>Retour aux drops</Text></Pressable>
      </View>
    );
  }

  // ---------- price held: payment ----------
  if (lock) {
    const expired = lockLeft <= 0;
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 18 }}>
          <Text style={styles.name}>{expired ? "Temps écoulé" : "Paiement"}</Text>
          {expired ? (
            <Text style={styles.body}>Le paiement n'a pas été fait en 2 minutes. La pièce est revenue dans le drop.</Text>
          ) : (
            <>
              <View style={styles.holdCard}>
                <Text style={styles.meta}>Prix bloqué pour vous</Text>
                <Text style={styles.holdPrice}>{formatLivePrice(lock.price)}</Text>
                <Text style={styles.holdTimer}>Encore {mmss(lockLeft)} pour payer</Text>
              </View>
              <View style={{ gap: 10 }}>
                <Line label={`${p.name}${lock.size ? ` · ${lock.size}` : ""}`} value={formatLivePrice(lock.price)} />
                <Line label="Frais de service" value="Calculés au paiement" />
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </>
          )}
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: insets.bottom + 14, gap: 10 }]}>
          {expired ? (
            <Pressable onPress={() => { setLock(null); setError(null); }} style={styles.cta}><Text style={styles.ctaText}>Retour au drop</Text></Pressable>
          ) : (
            <>
              <Pressable onPress={onPay} style={styles.cta}><Text style={styles.ctaText}>Payer avec Konnect</Text></Pressable>
              <Pressable onPress={onCancel} style={styles.ghost}><Text style={styles.ghostText}>Annuler</Text></Pressable>
            </>
          )}
        </View>
      </View>
    );
  }

  // ---------- item ----------
  const price = dropPrice(drop, now);
  const ctaText =
    state === "upcoming" ? `Commence dans ${mmss((drop.startsAt - now) / 1000)}` :
    state === "ended" ? (left <= 0 ? "Épuisé" : "Drop terminé") :
    needsSize ? "Choisissez une taille" :
    `Bloquer ce prix · ${formatLivePrice(price)}`;
  const canLock = state === "live" && !needsSize && !busy;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
        <Image source={{ uri: p.images[0] }} style={{ width, height: width * 1.1, backgroundColor: colors.mist }} contentFit="cover" />
        <View style={{ padding: 18, gap: 6 }}>
          <Text style={styles.meta}>{p.brand.name}{p.brand.city ? ` · ${p.brand.city}` : ""}</Text>
          <Text style={styles.name}>{p.name}</Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
            <Text style={styles.price}>{state === "upcoming" ? formatPrice(drop.startPrice) : formatLivePrice(price)}</Text>
            {state !== "upcoming" ? <Text style={styles.strike}>{formatPrice(drop.startPrice)}</Text> : null}
            {state === "live" ? <Text style={styles.pct}>{dropDiscountText(drop, now)}</Text> : null}
          </View>
          {state !== "upcoming" ? <View style={{ marginTop: 4 }}><ProgressBar value={dropProgress(drop, now)} /></View> : null}

          {hasSizes && (
            <View style={{ marginTop: 14 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={styles.sizeLabel}>Taille</Text>
                <Text style={styles.low}>{stockLabel(left)}</Text>
              </View>
              <View style={styles.variants}>
                {p.variants.map((v) => {
                  const on = v === size;
                  return (
                    <Pressable key={v} onPress={() => { setSize(v); Haptics.selectionAsync().catch(() => {}); }} style={[styles.variant, on && styles.variantOn]}>
                      <Text style={[styles.variantText, on && { color: "#fff" }]}>{v}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
          {!hasSizes ? <Text style={[styles.low, { marginTop: 10 }]}>{stockLabel(left)}</Text> : null}
          <Text style={[styles.meta, { marginTop: 14, lineHeight: 19 }]}>Paiement en ligne uniquement (Konnect). Le prix est bloqué 2 minutes pendant le paiement.</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </ScrollView>

      <Pressable onPress={back} style={[styles.round, { top: insets.top + 8, left: 14 }]} hitSlop={8} accessibilityRole="button" accessibilityLabel="Retour">
        <Text style={{ color: colors.ink, fontSize: 18 }}>←</Text>
      </Pressable>
      {state === "live" ? (
        <View style={[styles.timer, { top: insets.top + 14 }]}><Text style={styles.timerText}>Fin dans {mmss((drop.startsAt + drop.durationSec * 1000 - now) / 1000)}</Text></View>
      ) : null}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable onPress={onLock} disabled={!canLock} style={[styles.cta, !canLock && styles.ctaOff]}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={[styles.ctaText, !canLock && { color: colors.muted }]}>{ctaText}</Text>}
        </Pressable>
      </View>
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Text style={[styles.meta, { fontSize: 15, flex: 1 }]} numberOfLines={1}>{label}</Text>
      <Text style={{ fontSize: 15, color: colors.ink, fontVariant: ["tabular-nums"] }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  meta: { fontSize: 14, color: colors.muted },
  body: { fontSize: 15, color: colors.muted, lineHeight: 22 },
  name: { color: colors.ink, fontSize: 26, fontWeight: "700", letterSpacing: -0.5 },
  price: { fontSize: 24, fontWeight: "700", color: colors.ink, fontVariant: ["tabular-nums"] },
  strike: { fontSize: 15, color: colors.muted, textDecorationLine: "line-through" },
  pct: { fontSize: 14, fontWeight: "700", color: colors.pink, fontVariant: ["tabular-nums"] },
  sizeLabel: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  low: { fontSize: 12, color: colors.pink, fontWeight: "600" },
  variants: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  variant: { minWidth: 48, alignItems: "center", paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line },
  variantOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  variantText: { color: colors.ink, fontSize: 14, fontWeight: "600" },
  error: { fontSize: 14, color: colors.pink, fontWeight: "600", marginTop: 10 },
  round: { position: "absolute", width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },
  timer: { position: "absolute", right: 14, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: colors.pink },
  timerText: { color: "#fff", fontSize: 12, fontWeight: "700", fontVariant: ["tabular-nums"] },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line },
  cta: { backgroundColor: colors.ink, height: 52, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  ctaOff: { backgroundColor: colors.mist },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 16, fontVariant: ["tabular-nums"] },
  ghost: { height: 48, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, alignItems: "center", justifyContent: "center" },
  ghostText: { color: colors.ink, fontWeight: "600", fontSize: 15 },
  holdCard: { borderRadius: radius.md, backgroundColor: colors.mist, padding: 18, gap: 4 },
  holdPrice: { fontSize: 30, fontWeight: "700", letterSpacing: -0.5, color: colors.ink, fontVariant: ["tabular-nums"] },
  holdTimer: { fontSize: 13, color: colors.pink, fontWeight: "600", fontVariant: ["tabular-nums"] },
});
