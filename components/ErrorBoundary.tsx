import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/lib/theme";

type State = { error: Error | null };

/**
 * Last line of defence: a crash anywhere in the tree shows this screen instead
 * of a blank white page. The message helps us find the cause.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[weslet] crash:", error, info?.componentStack);
  }

  reload = () => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.location.href = "/";
      return;
    }
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    const msg = String(this.state.error?.message || this.state.error || "").slice(0, 300);
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Oups, quelque chose s'est cassé.</Text>
        <Text style={styles.text}>Ce n'est pas vous. Touchez « Recharger » pour reprendre.</Text>
        <Pressable onPress={this.reload} style={styles.btn}>
          <Text style={styles.btnText}>Recharger</Text>
        </Pressable>
        {msg ? <Text style={styles.detail} selectable>Détail technique : {msg}</Text> : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", padding: 28, gap: 12 },
  title: { fontSize: 22, fontWeight: "800", color: colors.ink, textAlign: "center" },
  text: { fontSize: 15, color: colors.muted, textAlign: "center" },
  btn: { marginTop: 8, backgroundColor: colors.ink, paddingHorizontal: 24, paddingVertical: 13, borderRadius: radius.pill },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  detail: { marginTop: 18, fontSize: 11, color: colors.muted, textAlign: "center" },
});
