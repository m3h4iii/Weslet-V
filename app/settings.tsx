import { useState } from "react";
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { useAuth } from "@/lib/auth";
import { usePrefs } from "@/lib/prefs";
import { deleteMyAccount, IS_MOCK } from "@/lib/data";
import { CONTACT_EMAIL, LEGAL_PAGES } from "@/lib/legal";
import { colors, radius } from "@/lib/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const { signedIn, profile, signOut } = useAuth();
  const { sizes, favorites, follows, notif, setNotif, sound, setSound } = usePrefs();
  const [busy, setBusy] = useState(false);
  const version = Constants.expoConfig?.version ?? "2.0";

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)/profile"));

  const confirmDelete = () => {
    const run = async () => {
      setBusy(true);
      try { await deleteMyAccount(); Alert.alert("Compte supprimé", "Vos données personnelles ont été effacées."); router.replace("/(tabs)"); }
      catch (e: any) { Alert.alert("Suppression", e.message ?? "Impossible pour le moment."); }
      finally { setBusy(false); }
    };
    if (Platform.OS === "web") { if (window.confirm("Supprimer définitivement votre compte ?")) run(); return; }
    Alert.alert("Supprimer mon compte", "Définitif : vos informations personnelles sont effacées. Les commandes livrées restent anonymisées pour la boutique.", [
      { text: "Annuler", style: "cancel" }, { text: "Supprimer", style: "destructive", onPress: run },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.bar}>
        <Pressable onPress={goBack} hitSlop={10} style={styles.back}><Text style={{ fontSize: 18, color: colors.ink }}>←</Text></Pressable>
        <Text style={styles.title}>Paramètres</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 22, paddingBottom: 60 }}>

        <Section title="Compte">
          {signedIn ? (
            <>
              <Row label="Profil" value={profile?.fullName || profile?.email || ""} onPress={() => router.push("/(tabs)/profile")} />
              <Row label="Adresse de livraison" onPress={() => router.push("/(tabs)/profile")} />
              <Row label="Mes commandes" onPress={() => router.push("/orders")} />
            </>
          ) : (
            <Row label="Se connecter" value="Code par email" onPress={() => router.push("/auth")} />
          )}
        </Section>

        <Section title="Préférences">
          <Row label="Mes tailles" value={sizes.length ? sizes.join(" · ") : "À définir"} onPress={() => router.push("/sizes")} />
          <Row label="Favoris" value={favorites.length ? String(favorites.length) : ""} onPress={() => router.push("/favorites")} />
          <Row label="Boutiques suivies" value={follows.length ? String(follows.length) : ""} onPress={() => router.push("/(tabs)/profile")} />
          <Toggle label="Son des vidéos activé" value={sound} onChange={setSound} />
          <Row label="Langue" value="Français" hint="Arabe bientôt" />
        </Section>

        <Section title="Notifications" hint={IS_MOCK || Platform.OS === "web" ? "Les notifications arrivent avec la version App Store. Vos choix sont enregistrés." : undefined}>
          <Toggle label="Suivi de mes commandes" value={notif.orders} onChange={(v) => setNotif({ orders: v })} />
          <Toggle label="Nouveautés des boutiques suivies" value={notif.drops} onChange={(v) => setNotif({ drops: v })} />
          <Toggle label="Offres et promotions" value={notif.promos} onChange={(v) => setNotif({ promos: v })} />
        </Section>

        <Section title="Aide et informations">
          {LEGAL_PAGES.map((p) => (
            <Row key={p.slug} label={p.title} onPress={() => router.push({ pathname: "/legal/[slug]", params: { slug: p.slug } })} />
          ))}
          <Row label="Nous contacter" value={CONTACT_EMAIL} onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=Weslet`)} />
          <Row label="Vous êtes une boutique ?" value="Vendre sur Weslet" onPress={() => router.push({ pathname: "/legal/[slug]", params: { slug: "faq" } })} />
        </Section>

        {signedIn && !IS_MOCK ? (
          <Section title="Session">
            <Row label="Se déconnecter" onPress={() => { signOut(); goBack(); }} />
            <Row label="Supprimer mon compte" danger onPress={busy ? undefined : confirmDelete} />
          </Section>
        ) : null}

        <Text style={styles.version}>Weslet {version}{IS_MOCK ? " · mode démo" : ""}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.section}>{title}</Text>
      <View style={styles.card}>{children}</View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

function Row({ label, value, hint, onPress, danger }: { label: string; value?: string; hint?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, danger && { color: "#B42323" }]}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      {value ? <Text style={styles.rowValue} numberOfLines={1}>{value}</Text> : null}
      {onPress ? <Text style={styles.chev}>›</Text> : null}
    </Pressable>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { flex: 1 }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.violet, false: colors.line }} thumbColor="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 8 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700", color: colors.ink },
  section: { fontSize: 13, color: colors.muted, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 4 },
  card: { backgroundColor: colors.mist, borderRadius: radius.lg, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, minHeight: 52, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" },
  rowLabel: { fontSize: 16, color: colors.ink },
  rowHint: { fontSize: 12, color: colors.muted, marginTop: 2 },
  rowValue: { fontSize: 14, color: colors.muted, maxWidth: "50%" },
  chev: { fontSize: 20, color: colors.muted },
  hint: { fontSize: 12, color: colors.muted, paddingHorizontal: 4 },
  version: { textAlign: "center", color: colors.muted, fontSize: 12, marginTop: 8 },
});
