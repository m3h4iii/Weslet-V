import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Field } from "@/components/Field";
import { GOVERNORATES } from "@/lib/address";
import { colors, radius } from "@/lib/theme";
import type { Address } from "@/lib/types";

type Props = {
  value: Address;
  onChange: (next: Address) => void;
  /** Hide name/phone when they're shown elsewhere (e.g. profile screen). */
  showRecipient?: boolean;
};

export function AddressForm({ value, onChange, showRecipient = true }: Props) {
  const [govOpen, setGovOpen] = useState(false);
  const set = (k: keyof Address) => (v: string) => onChange({ ...value, [k]: v });

  return (
    <View style={{ gap: 14 }}>
      {showRecipient && (
        <>
          <Field label="Nom du destinataire" value={value.recipientName} onChangeText={set("recipientName")} placeholder="Amira Ben Salah" autoCapitalize="words" />
          <Field label="Téléphone" value={value.phone} onChangeText={set("phone")} placeholder="22 123 456" keyboardType="phone-pad" hint="Le livreur vous appelle avant de passer." />
        </>
      )}

      <View style={{ gap: 6 }}>
        <Text style={styles.label}>Gouvernorat</Text>
        <Pressable onPress={() => setGovOpen((v) => !v)} style={styles.select}>
          <Text style={[styles.selectText, !value.governorate && { color: colors.muted }]}>{value.governorate || "Choisir…"}</Text>
          <Text style={{ color: colors.muted }}>{govOpen ? "▴" : "▾"}</Text>
        </Pressable>
        {govOpen && (
          <View style={styles.govGrid}>
            {GOVERNORATES.map((g) => (
              <Pressable
                key={g}
                onPress={() => { set("governorate")(g); setGovOpen(false); }}
                style={[styles.chip, value.governorate === g && styles.chipOn]}
              >
                <Text style={[styles.chipText, value.governorate === g && { color: "#fff" }]}>{g}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <Field label="Ville / délégation" value={value.city} onChangeText={set("city")} placeholder="La Marsa" autoCapitalize="words" />
      <Field
        label="Adresse"
        value={value.addressLine}
        onChangeText={set("addressLine")}
        placeholder="Rue, immeuble, étage, repère…"
        multiline
        style={{ minHeight: 72, textAlignVertical: "top" }}
      />
      <Field label="Instructions (optionnel)" value={value.notes} onChangeText={set("notes")} placeholder="Appeler avant, code portail…" />
    </View>
  );
}

const styles = StyleSheet.create({
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
});
