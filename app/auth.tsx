import { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRootNavigationState, useRouter } from "expo-router";
import { Field, fieldStyles } from "@/components/Field";
import { Wordmark } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { IS_MOCK } from "@/lib/data";
import { normalizePhone } from "@/lib/address";
import { colors, radius } from "@/lib/theme";

type Step = "email" | "code" | "profile";

export default function AuthScreen() {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { signedIn, profile, sendCode, verifyCode, updateProfile } = useAuth();
  const navReady = !!useRootNavigationState()?.key;

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const codeRef = useRef<TextInput>(null);

  const finish = () => (next ? router.replace(next as any) : router.canGoBack() ? router.back() : router.replace("/(tabs)/profile"));

  // Already signed in (or mock mode): only the profile step can be useful.
  useEffect(() => {
    if (!navReady) return;
    if (IS_MOCK) { finish(); return; }
    if (signedIn && step !== "profile") {
      if (profile && !profile.fullName) { setFullName(profile.fullName); setPhone(profile.phone); setStep("profile"); }
      else finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, profile, navReady]);

  const onSend = async () => {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return Alert.alert("Email", "Entrez une adresse email valide.");
    setBusy(true);
    try {
      await sendCode(email);
      setStep("code");
      setTimeout(() => codeRef.current?.focus(), 200);
    } catch (e: any) {
      Alert.alert("Connexion", e.message ?? "Impossible d'envoyer le code.");
    } finally { setBusy(false); }
  };

  const onVerify = async () => {
    if (code.trim().length < 6) return Alert.alert("Code", "Entrez le code reçu par email (6 à 10 chiffres).");
    setBusy(true);
    try {
      await verifyCode(email, code);
      // onAuthStateChange → the effect above decides: profile step or finish.
    } catch (e: any) {
      Alert.alert("Connexion", e.message ?? "Code invalide.");
    } finally { setBusy(false); }
  };

  const onProfile = async () => {
    if (fullName.trim().length < 2) return Alert.alert("Profil", "Indiquez votre nom.");
    if (phone.trim() && !normalizePhone(phone)) return Alert.alert("Profil", "Numéro invalide (8 chiffres).");
    setBusy(true);
    try {
      await updateProfile({ fullName, phone: normalizePhone(phone) ?? "" });
      finish();
    } catch (e: any) {
      Alert.alert("Profil", e.message ?? "Enregistrement impossible.");
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.top}>
            <Wordmark />
            <Pressable onPress={() => router.back()} hitSlop={10}><Text style={styles.close}>✕</Text></Pressable>
          </View>

          {step === "email" && (
            <View style={styles.card}>
              <Text style={styles.h1}>Connexion</Text>
              <Text style={styles.p}>Pas de mot de passe : on vous envoie un code par email.</Text>
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="vous@exemple.tn"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                returnKeyType="send"
                onSubmitEditing={onSend}
              />
              <Pressable onPress={onSend} disabled={busy} style={[fieldStyles.primary, busy && { opacity: 0.6 }]}>
                <Text style={fieldStyles.primaryText}>{busy ? "Envoi…" : "Recevoir le code"}</Text>
              </Pressable>
            </View>
          )}

          {step === "code" && (
            <View style={styles.card}>
              <Text style={styles.h1}>Votre code</Text>
              <Text style={styles.p}>Envoyé à <Text style={{ color: colors.ink, fontWeight: "600" }}>{email.trim()}</Text>. Vérifiez aussi les spams.</Text>
              <Field
                ref={codeRef}
                label="Code reçu par email"
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 10))}
                placeholder="123456"
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
                maxLength={10}
                style={styles.codeInput}
                returnKeyType="done"
                onSubmitEditing={onVerify}
              />
              <Pressable onPress={onVerify} disabled={busy} style={[fieldStyles.primary, busy && { opacity: 0.6 }]}>
                <Text style={fieldStyles.primaryText}>{busy ? "Vérification…" : "Se connecter"}</Text>
              </Pressable>
              <View style={styles.rowLinks}>
                <Pressable onPress={() => { setCode(""); setStep("email"); }} hitSlop={8}><Text style={fieldStyles.link}>Changer d'email</Text></Pressable>
                <Pressable onPress={onSend} disabled={busy} hitSlop={8}><Text style={fieldStyles.link}>Renvoyer le code</Text></Pressable>
              </View>
            </View>
          )}

          {step === "profile" && (
            <View style={styles.card}>
              <Text style={styles.h1}>Bienvenue 👋</Text>
              <Text style={styles.p}>Une dernière chose pour vos livraisons.</Text>
              <Field label="Nom complet" value={fullName} onChangeText={setFullName} placeholder="Amira Ben Salah" autoCapitalize="words" />
              <Field label="Téléphone" value={phone} onChangeText={setPhone} placeholder="22 123 456" keyboardType="phone-pad" hint="Le livreur vous appelle sur ce numéro." />
              <Pressable onPress={onProfile} disabled={busy} style={[fieldStyles.primary, busy && { opacity: 0.6 }]}>
                <Text style={fieldStyles.primaryText}>{busy ? "Enregistrement…" : "Continuer"}</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  body: { padding: 16, gap: 18 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  close: { fontSize: 18, color: colors.muted },
  card: { padding: 18, borderRadius: radius.lg, backgroundColor: colors.mist, gap: 14 },
  h1: { fontSize: 26, fontWeight: "700", letterSpacing: -0.5, color: colors.ink },
  p: { fontSize: 15, color: colors.muted, lineHeight: 21 },
  codeInput: { fontSize: 24, letterSpacing: 4, textAlign: "center", fontWeight: "700" },
  rowLinks: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 },
});
