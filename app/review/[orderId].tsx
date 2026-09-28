import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { fieldStyles } from "@/components/Field";
import { fetchOrder, myReviewForOrder, submitReview } from "@/lib/data";
import { colors, radius } from "@/lib/theme";
import type { Order } from "@/lib/types";

const LABELS = ["", "Très déçu", "Bof", "Correct", "Très bien", "Parfait"];

export default function ReviewScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchOrder(orderId).then(setOrder);
    myReviewForOrder(orderId).then((r) => { if (r) { setRating(r.rating); setComment(r.comment ?? ""); } });
  }, [orderId]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/orders"));

  const send = async () => {
    if (!order) return;
    if (rating === 0) return Alert.alert("Votre note", "Choisissez de 1 à 5 étoiles.");
    setBusy(true);
    try {
      await submitReview(order, rating, comment);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert("Merci !", `Votre avis sur ${order.merchant.name} est publié.`);
      goBack();
    } catch (e: any) {
      Alert.alert("Avis", e.message ?? "Impossible d'enregistrer l'avis.");
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.bar}>
        <Pressable onPress={goBack} hitSlop={10} style={styles.back}><Text style={{ fontSize: 18, color: colors.ink }}>←</Text></Pressable>
        <Text style={styles.title}>Votre avis</Text>
        <View style={{ width: 40 }} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.h1}>{order ? order.merchant.name : "…"}</Text>
          <Text style={styles.p}>Commande {order?.number}. Votre avis est public, avec votre prénom. Il aide les autres clients et la boutique.</Text>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => { setRating(n); Haptics.selectionAsync().catch(() => {}); }} hitSlop={6}>
                <Text style={[styles.star, n <= rating && styles.starOn]}>★</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>{LABELS[rating]}</Text>

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Qualité, taille, délai, contact avec la boutique… (optionnel)"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={600}
            style={styles.input}
          />
          <Pressable onPress={send} disabled={busy || !order} style={[fieldStyles.primary, (busy || !order) && { opacity: 0.6 }]}>
            <Text style={fieldStyles.primaryText}>{busy ? "Envoi…" : "Publier mon avis"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 8 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700", color: colors.ink },
  h1: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5, color: colors.ink },
  p: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  stars: { flexDirection: "row", justifyContent: "center", gap: 10, marginTop: 10 },
  star: { fontSize: 46, color: colors.line },
  starOn: { color: "#FFB020" },
  label: { textAlign: "center", fontSize: 15, fontWeight: "600", color: colors.ink, minHeight: 20 },
  input: { minHeight: 120, borderRadius: radius.md, backgroundColor: colors.mist, padding: 14, fontSize: 16, color: colors.ink, textAlignVertical: "top" },
});
