import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { Field, fieldStyles } from "@/components/Field";
import { AddressForm } from "@/components/AddressForm";
import { useAuth } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";
import { fetchBrands } from "@/lib/data";
import type { Brand } from "@/lib/types";
import { IS_MOCK } from "@/lib/data";
import { emptyAddress, loadAddress, normalizePhone, saveAddress, validateAddress } from "@/lib/address";
import { colors, radius } from "@/lib/theme";
import type { Address } from "@/lib/types";

export default function ProfileScreen() {
  const router = useRouter();
  const { ready, signedIn, profile, updateProfile, signOut } = useAuth();
  const { favorites, sizes, follows } = usePrefs();
  const [followed, setFollowed] = useState<Brand[]>([]);
  useEffect(() => {
    if (follows.length === 0) return setFollowed([]);
    fetchBrands().then((bs) => setFollowed(bs.filter((b) => follows.includes(b.id)))).catch(() => {});
  }, [follows]);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [address, setAddress] = useState<Address | null>(null);
  const [editingAddr, setEditingAddr] = useState(false);
  const [draftAddr, setDraftAddr] = useState<Address>(emptyAddress);
  const [savingAddr, setSavingAddr] = useState(false);

  useEffect(() => { setFullName(profile?.fullName ?? ""); setPhone(profile?.phone ?? ""); }, [profile]);
  useFocusEffect(useCallback(() => { loadAddress().then(setAddress); }, []));

  const startEditAddr = () => {
    setDraftAddr({
      ...emptyAddress,
      ...(address ?? {}),
      recipientName: address?.recipientName || profile?.fullName || "",
      phone: address?.phone || profile?.phone || "",
    });
    setEditingAddr(true);
  };

  const saveAddr = async () => {
    const err = validateAddress(draftAddr);
    if (err) return Alert.alert("Adresse", err);
    setSavingAddr(true);
    const clean: Address = { ...draftAddr, phone: normalizePhone(draftAddr.phone) ?? draftAddr.phone };
    await saveAddress(clean);
    setAddress(clean);
    setSavingAddr(false);
    setEditingAddr(false);
  };

  const save = async () => {
    if (fullName.trim().length < 2) return Alert.alert("Profil", "Indiquez votre nom.");
    if (phone.trim() && !normalizePhone(phone)) return Alert.alert("Profil", "Numéro invalide (8 chiffres).");
    setBusy(true);
    try { await updateProfile({ fullName, phone: normalizePhone(phone) ?? "" }); setEditing(false); }
    catch (e: any) { Alert.alert("Profil", e.message ?? "Enregistrement impossible."); }
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.title}>Profil</Text>

        <Pressable onPress={() => router.push("/favorites")} style={styles.rowBtn}>
          <Text style={styles.rowBtnText}>Favoris</Text>
          <Text style={styles.rowMeta}>{favorites.length > 0 ? `${favorites.length}  ›` : "›"}</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/sizes")} style={styles.rowBtn}>
          <Text style={styles.rowBtnText}>Mes tailles</Text>
          <Text style={styles.rowMeta} numberOfLines={1}>{sizes.length > 0 ? `${sizes.join(" · ")}  ›` : "À définir  ›"}</Text>
        </Pressable>
        {followed.length > 0 ? (
          <View style={styles.box}>
            <Text style={styles.label}>Boutiques suivies</Text>
            {followed.map((b) => (
              <Pressable key={b.id} onPress={() => router.push({ pathname: "/boutique/[id]", params: { id: b.id } })} style={styles.brandRow}>
                <Text style={styles.value}>{b.name}</Text>
                <Text style={styles.hint}>{b.city ?? ""}  ›</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {!ready ? null : !signedIn ? (
          <View style={styles.box}>
            <Text style={styles.h2}>Bienvenue sur Weslet</Text>
            <Text style={styles.p}>Connectez-vous pour commander et suivre vos livraisons. Un code par email, pas de mot de passe.</Text>
            <Pressable onPress={() => router.push("/auth")} style={fieldStyles.primary}>
              <Text style={fieldStyles.primaryText}>Se connecter</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.box}>
              {IS_MOCK && <Text style={styles.demo}>Mode démo — les comptes réels s'activent avec les clés Supabase.</Text>}
              {editing ? (
                <>
                  <Field label="Nom complet" value={fullName} onChangeText={setFullName} autoCapitalize="words" placeholder="Amira Ben Salah" />
                  <Field label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="22 123 456" />
                  <View style={styles.actions}>
                    <Pressable onPress={() => setEditing(false)} style={[fieldStyles.secondary, { flex: 1 }]}><Text style={fieldStyles.secondaryText}>Annuler</Text></Pressable>
                    <Pressable onPress={save} disabled={busy} style={[fieldStyles.primary, { flex: 1, height: 46 }, busy && { opacity: 0.6 }]}><Text style={fieldStyles.primaryText}>{busy ? "…" : "Enregistrer"}</Text></Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.name}>{profile?.fullName || "Sans nom"}</Text>
                  <Text style={styles.value}>{profile?.email ?? ""}</Text>
                  <Text style={styles.value}>{profile?.phone || "Téléphone non renseigné"}</Text>
                  <Pressable onPress={() => setEditing(true)} hitSlop={8}><Text style={fieldStyles.link}>Modifier</Text></Pressable>
                </>
              )}
            </View>

            <Pressable onPress={() => router.push("/orders")} style={styles.rowBtn}>
              <Text style={styles.rowBtnText}>Mes commandes</Text>
              <Text style={styles.chev}>›</Text>
            </Pressable>

            <View style={styles.box}>
              <Text style={styles.label}>Adresse de livraison</Text>
              {editingAddr ? (
                <>
                  <AddressForm value={draftAddr} onChange={setDraftAddr} />
                  <View style={styles.actions}>
                    <Pressable onPress={() => setEditingAddr(false)} style={[fieldStyles.secondary, { flex: 1 }]}><Text style={fieldStyles.secondaryText}>Annuler</Text></Pressable>
                    <Pressable onPress={saveAddr} disabled={savingAddr} style={[fieldStyles.primary, { flex: 1, height: 46 }, savingAddr && { opacity: 0.6 }]}><Text style={fieldStyles.primaryText}>{savingAddr ? "…" : "Enregistrer"}</Text></Pressable>
                  </View>
                </>
              ) : address ? (
                <>
                  <Text style={styles.value}>{address.recipientName} · {address.phone}</Text>
                  <Text style={styles.value}>{address.addressLine}</Text>
                  <Text style={styles.value}>{address.city}, {address.governorate}</Text>
                  {address.notes ? <Text style={styles.hint}>« {address.notes} »</Text> : null}
                  <Pressable onPress={startEditAddr} hitSlop={8}><Text style={fieldStyles.link}>Modifier</Text></Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.hint}>Aucune adresse enregistrée. Elle sera pré-remplie à chaque commande.</Text>
                  <Pressable onPress={startEditAddr} hitSlop={8}><Text style={fieldStyles.link}>Ajouter une adresse</Text></Pressable>
                </>
              )}
            </View>

            {!IS_MOCK && (
              <View style={{ margin: 16, marginTop: 0 }}>
                <Pressable onPress={signOut} style={fieldStyles.secondary}><Text style={fieldStyles.secondaryText}>Se déconnecter</Text></Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.6, paddingHorizontal: 16, paddingTop: 8, color: colors.ink },
  box: { margin: 16, marginBottom: 0, padding: 18, borderRadius: radius.lg, backgroundColor: colors.mist, gap: 10 },
  h2: { fontSize: 20, fontWeight: "700", color: colors.ink, letterSpacing: -0.3 },
  p: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  demo: { color: "#8A5A00", fontSize: 12 },
  name: { color: colors.ink, fontSize: 20, fontWeight: "700" },
  label: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  value: { color: colors.ink, fontSize: 15 },
  hint: { color: colors.muted, fontSize: 12 },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  rowBtn: {
    margin: 16, marginBottom: 0, paddingHorizontal: 18, height: 56, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  rowBtnText: { fontSize: 16, fontWeight: "600", color: colors.ink },
  rowMeta: { fontSize: 14, color: colors.muted, maxWidth: "60%" },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  chev: { fontSize: 22, color: colors.muted },
});
