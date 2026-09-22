import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRootNavigationState, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Field, fieldStyles } from "@/components/Field";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { DELIVERY_FEE, GOVERNORATES, emptyAddress, loadAddress, normalizePhone, saveAddress, validateAddress } from "@/lib/address";
import { IS_MOCK, orderTotals, placeOrders } from "@/lib/data";
import { colors, formatPrice, radius } from "@/lib/theme";
import type { Address } from "@/lib/types";

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { lines, clear } = useCart();
  const { signedIn, ready, profile } = useAuth();
  const navReady = !!useRootNavigationState()?.key;
  const [addr, setAddr] = useState<Address>(emptyAddress);
  const [govOpen, setGovOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { groups, subtotal, delivery, total } = useMemo(() => orderTotals(lines), [lines]);
  const set = (k: keyof Address) => (v: string) => setAddr((a) => ({ ...a, [k]: v }));

  // Must be signed in to order (the RPC checks auth.uid()).
  useEffect(() => {
    if (navReady && ready && !signedIn) router.replace({ pathname: "/auth", params: { next: "/checkout" } });
  }, [navReady, ready, signedIn, router]);

  // Prefill from the last delivery address, then from the profile.
  useEffect(() => {
    loadAddress().then((saved) => {
      setAddr((a) => ({
        ...a,
        ...(saved ?? {}),
        recipientName: saved?.recipientName || profile?.fullName || a.recipientName,
        phone: saved?.phone || profile?.phone || a.phone,
      }));
    });
  }, [profile?.fullName, profile?.phone]);

  const submit = async () => {
    const err = validateAddress(addr);
    if (err) return Alert.alert("Livraison", err);
    if (lines.length === 0) return Alert.alert("Panier", "Votre panier est vide.");
    setBusy(true);
    try {
      const clean: Address = { ...addr, phone: normalizePhone(addr.phone) ?? addr.phone };
      const ids = await placeOrders(lines, clean);
      await saveAddress(clean);
      clear();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (ids.length === 1) router.replace({ pathname: "/orders/[id]", params: { id: ids[0], placed: "1" } });
      else router.replace({ pathname: "/orders", params: { placed: String(ids.length) } });
    } catch (e: any) {
      Alert.alert("Commande", e.message ?? "La commande n'a pas pu être passée.");
    } finally {
      setBusy(false);
    }
  };

  if (lines.length === 0) {
    return (
      <SafeAreaView style={styles.screen}>
        <Header onBack={() => router.back()} />
        <Text style={styles.empty}>Votre panier est vide.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Header onBack={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 22, paddingBottom: 160 }} keyboardShouldPersistTaps="handled">
          {IS_MOCK && (
            <View style={styles.demo}>
              <Text style={styles.demoText}>Mode démo : la commande est enregistrée sur cet appareil uniquement.</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.h2}>Livraison</Text>
            <Field label="Nom du destinataire" value={addr.recipientName} onChangeText={set("recipientName")} placeholder="Amira Ben Salah" autoCapitalize="words" />
            <Field label="Téléphone" value={addr.phone} onChangeText={set("phone")} placeholder="22 123 456" keyboardType="phone-pad" hint="Le livreur vous appelle avant de passer." />

            <View style={{ gap: 6 }}>
              <Text style={styles.label}>Gouvernorat</Text>
              <Pressable onPress={() => setGovOpen((v) => !v)} style={styles.select}>
                <Text style={[styles.selectText, !addr.governorate && { color: colors.muted }]}>{addr.governorate || "Choisir…"}</Text>
                <Text style={{ color: colors.muted }}>{govOpen ? "▴" : "▾"}</Text>
              </Pressable>
              {govOpen && (
                <View style={styles.govGrid}>
                  {GOVERNORATES.map((g) => (
                    <Pressable
                      key={g}
                      onPress={() => { set("governorate")(g); setGovOpen(false); }}
                      style={[styles.chip, addr.governorate === g && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, addr.governorate === g && { color: "#fff" }]}>{g}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Field label="Ville / délégation" value={addr.city} onChangeText={set("city")} placeholder="La Marsa" autoCapitalize="words" />
            <Field label="Adresse" value={addr.addressLine} onChangeText={set("addressLine")} placeholder="Rue, immeuble, étage, repère…" multiline style={{ minHeight: 72, textAlignVertical: "top" }} />
            <Field label="Instructions (optionnel)" value={addr.notes} onChangeText={set("notes")} placeholder="Appeler avant, code portail…" />
          </View>

          <View style={styles.section}>
            <Text style={styles.h2}>Récapitulatif</Text>
            {groups.map((g) => (
              <View key={g.brand.id} style={styles.boutique}>
                <View style={styles.boutiqueHead}>
                  <Text style={styles.boutiqueName}>{g.brand.name}</Text>
                  <Text style={styles.muted}>Livraison {formatPrice(DELIVERY_FEE)}</Text>
                </View>
                {g.lines.map((l) => (
                  <View key={`${l.product.id}:${l.variant ?? ""}`} style={styles.line}>
                    <Text style={styles.lineName} numberOfLines={1}>
                      {l.qty} × {l.product.name}{l.variant ? ` · ${l.variant}` : ""}
                    </Text>
                    <Text style={styles.lineTotal}>{formatPrice(l.qty * l.product.price)}</Text>
                  </View>
                ))}
              </View>
            ))}
            <Row label="Sous-total" value={formatPrice(subtotal)} />
            <Row label={`Livraison (${groups.length} colis)`} value={formatPrice(delivery)} />
            <Row label="Total à payer à la livraison" value={formatPrice(total)} bold />
            <Text style={styles.cod}>Paiement en espèces à la réception du colis.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable onPress={submit} disabled={busy} style={[fieldStyles.primary, { height: 54 }, busy && { opacity: 0.6 }]}>
          <Text style={[fieldStyles.primaryText, { fontSize: 16 }]}>{busy ? "Envoi de la commande…" : `Confirmer · ${formatPrice(total)}`}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={10} style={styles.back}><Text style={{ fontSize: 18, color: colors.ink }}>←</Text></Pressable>
      <Text style={styles.title}>Commander</Text>
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
  demo: { padding: 12, borderRadius: radius.md, backgroundColor: "#FFF4D6" },
  demoText: { color: "#8A5A00", fontSize: 13 },
  section: { padding: 16, borderRadius: radius.lg, backgroundColor: colors.mist, gap: 14 },
  h2: { fontSize: 18, fontWeight: "700", color: colors.ink, letterSpacing: -0.3 },
  label: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  select: {
    minHeight: 48, borderRadius: radius.md, backgroundColor: "#fff", paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  selectText: { fontSize: 16, color: colors.ink },
  govGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingTop: 4 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: "#fff" },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 13, color: colors.ink },
  boutique: { gap: 6, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  boutiqueHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  boutiqueName: { fontSize: 15, fontWeight: "700", color: colors.ink },
  muted: { fontSize: 13, color: colors.muted },
  line: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  lineName: { flex: 1, fontSize: 14, color: colors.ink },
  lineTotal: { fontSize: 14, color: colors.ink },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { fontSize: 14, color: colors.muted },
  rowValue: { fontSize: 14, color: colors.ink },
  rowBold: { fontSize: 17, fontWeight: "700", color: colors.ink },
  cod: { fontSize: 12, color: colors.muted },
  footer: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.line },
});
