import type { Ref } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { colors, radius } from "@/lib/theme";

type Props = TextInputProps & { label: string; hint?: string; ref?: Ref<TextInput> };

export function Field({ label, hint, style, ref, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput ref={ref} placeholderTextColor={colors.muted} style={[styles.input, style]} {...rest} />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export const fieldStyles = StyleSheet.create({
  primary: { backgroundColor: colors.ink, height: 50, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondary: { height: 46, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.line },
  secondaryText: { color: colors.ink, fontSize: 15, fontWeight: "600" },
  link: { color: colors.violet, fontSize: 14, fontWeight: "600" },
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  input: {
    minHeight: 48, borderRadius: radius.md, backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: colors.ink, borderWidth: 1, borderColor: colors.line,
  },
  hint: { fontSize: 12, color: colors.muted },
});
