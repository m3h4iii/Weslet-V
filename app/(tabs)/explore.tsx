import { useEffect, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProductCard } from "@/components/ProductCard";
import { fetchCategories, searchProducts } from "@/lib/data";
import { colors, radius } from "@/lib/theme";
import type { Category, Product } from "@/lib/types";

export default function ExploreScreen() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);

  useEffect(() => { fetchCategories().then(setCats).catch(() => setCats([])); }, []);

  useEffect(() => {
    const t = setTimeout(() => searchProducts(q, cat).then(setItems).catch(() => setItems([])), 200);
    return () => clearTimeout(t);
  }, [q, cat]);

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.search}>
        <Text style={{ color: colors.muted, fontSize: 16 }}>⌕</Text>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Sac, robe, chéchia…"
          placeholderTextColor={colors.muted}
          style={styles.input}
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipsRow}>
        <Chip label="Tout" active={cat === null} onPress={() => setCat(null)} />
        {cats.map((c) => (
          <Chip key={c.slug} label={c.label} active={cat === c.slug} onPress={() => setCat(cat === c.slug ? null : c.slug)} />
        ))}
      </ScrollView>
      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 40 }}
        renderItem={({ item }) => <ProductCard product={item} />}
        ListEmptyComponent={<Text style={styles.empty}>Aucune pièce pour cette recherche.</Text>}
      />
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && { color: "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.white },
  search: {
    marginHorizontal: 16, marginTop: 8, height: 46, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line,
    flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, backgroundColor: colors.mist,
  },
  input: { flex: 1, fontSize: 16, color: colors.ink },
  chipsRow: { flexGrow: 0, height: 54 },
  chips: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 12, alignItems: "center" },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 14, color: colors.ink },
  empty: { textAlign: "center", color: colors.muted, marginTop: 40 },
});
