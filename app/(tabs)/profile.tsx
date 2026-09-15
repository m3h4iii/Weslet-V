import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { colors, radius } from "@/lib/theme";

export default function ProfileScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const sendLink = async () => {
    if (!email.includes("@")) return Alert.alert("Email", "Entrez une adresse valide.");
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: "weslet://" } });
    setBusy(false);
    Alert.alert(error ? "Connexion" : "Vérifiez vos emails", error ? error.message : "Un lien de connexion vous a été envoyé.");
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Text style={styles.title}>Profil</Text>
      {session ? (
        <View style={styles.box}>
          <Text style={styles.label}>Connecté</Text>
          <Text style={styles.value}>{session.user.email}</Text>
          <Pressable onPress={() => supabase.auth.signOut()} style={styles.secondary}><Text style={styles.secondaryText}>Se déconnecter</Text></Pressable>
        </View>
      ) : (
        <View style={styles.box}>
          <Text style={styles.label}>Connectez-vous pour suivre vos commandes.</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="vous@exemple.tn"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <Pressable onPress={sendLink} disabled={busy} style={styles.primary}>
            <Text style={styles.primaryText}>{busy ? "Envoi…" : "Recevoir un lien"}</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: -0.6, paddingHorizontal: 16, paddingTop: 8, color: colors.ink },
  box: { margin: 16, padding: 18, borderRadius: radius.lg, backgroundColor: colors.mist, gap: 12 },
  label: { color: colors.muted, fontSize: 14 },
  value: { color: colors.ink, fontSize: 16, fontWeight: "600" },
  input: { height: 46, borderRadius: radius.pill, backgroundColor: "#fff", paddingHorizontal: 16, fontSize: 16, color: colors.ink, borderWidth: 1, borderColor: colors.line },
  primary: { backgroundColor: colors.ink, height: 46, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondary: { height: 44, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line },
  secondaryText: { color: colors.ink, fontSize: 15 },
});
