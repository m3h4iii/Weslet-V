import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchProductsByIds, fetchRating, unitsLeft } from "@/lib/data";
import { fetchProductStats, isPopular, EMPTY_STATS, type ProductStats } from "@/lib/stats";
import { useCompare, MAX_COMPARE } from "@/lib/compare";
import { DELIVERY_FEE } from "@/lib/address";
import { colors, formatPrice, radius } from "@/lib/theme";
import type { Product, Rating } from "@/lib/types";

type Row = { label: string; render: (p: Product) => React.ReactNode };

export default function CompareScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { ids, remove, clear } = useCompare();
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Record<string, ProductStats>>({});
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      const list = ids.length ? await fetchProductsByIds(ids).catch(() => [] as Product[]) : [];
      const ordered = ids.map((id) => list.find((p) => p.id === id)).filter(Boolean) as Product[];
      const [st, ...rs] = await Promise.all([
        fetchProductStats(ordered.map((p) => p.id)),
        ...ordered.map((p) => fetchRating(p.brand.id).catch(() => ({ count: 0, avg: null }) as Rating)),
      ]);
      if (!alive) return;
      setProducts(ordered);
      setStats(st as Record<string, ProductStats>);
      const rmap: Record<string, Rating> = {};
      ordered.forEach((p, i) => { rmap[p.id] = rs[i] as Rating; });
      setRatings(rmap);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [ids.join(",")]);

  // Column width: 2 pieces fill the screen, 3 scroll sideways a little.
  const colW = Math.max(150, Math.floor((width - 32) / 2) - 4);

  const st = (p: Product) => stats[p.id] ?? EMPTY_STATS;
  const minPrice = products.length ? Math.min(...products.map((p) => p.price)) : 0;
  const maxSold = products.length ? Math.max(...products.map((p) => st(p).sold)) : 0;
  const sizesIn = (p: Product) => p.variants.filter((v) => unitsLeft(p, v) > 0);

  const rows: Row[] = [
    {
      label: "Prix",
      render: (p) => (
        <View>
          <Text style={styles.big}>{formatPrice(p.price)}</Text>
          {p.compareAt && p.compareAt > p.price ? <Text style={styles.strike}>{formatPrice(p.compareAt)}</Text> : null}
          {products.length > 1 && p.price === minPrice ? <Tag text="Meilleur prix" tone="good" /> : null}
        </View>
      ),
    },
    {
      label: "Boutique",
      render: (p) => {
        const r = ratings[p.id];
        return (
          <View>
            <Text style={styles.val}>{p.brand.name}</Text>
            <Text style={styles.sub}>{r && r.avg != null ? `★ ${r.avg.toFixed(1)} · ${r.count} avis` : "Pas encore d'avis"}</Text>
            {p.brand.city ? <Text style={styles.sub}>{p.brand.city}</Text> : null}
          </View>
        );
      },
    },
    {
      label: "Tailles dispo",
      render: (p) => {
        if (p.variants.length === 0) return <Text style={styles.val}>{p.stock > 0 ? "Taille unique" : "Épuisé"}</Text>;
        const ok = sizesIn(p);
        return <Text style={styles.val}>{ok.length ? ok.join(" · ") : "Épuisé"}</Text>;
      },
    },
    {
      label: "Stock",
      render: (p) => {
        const left = p.variants.length ? p.variants.reduce((a, v) => a + Math.max(0, unitsLeft(p, v)), 0) : p.stock;
        return <Text style={[styles.val, left > 0 && left <= 3 && { color: colors.pink }]}>{left <= 0 ? "Épuisé" : left <= 3 ? `Plus que ${left}` : "En stock"}</Text>;
      },
    },
    {
      label: "Popularité",
      render: (p) => {
        const s = st(p);
        return (
          <View>
            <Text style={styles.val}>{s.sold} vendu{s.sold > 1 ? "s" : ""}</Text>
            <Text style={styles.sub}>♥ {s.favorites} · 👀 {s.viewers7d} cette semaine</Text>
            {isPopular(s) ? <Tag text="🔥 Populaire" tone="hot" /> : products.length > 1 && s.sold > 0 && s.sold === maxSold ? <Tag text="Le plus vendu" tone="good" /> : null}
          </View>
        );
      },
    },
    { label: "Livraison", render: () => <Text style={styles.val}>{formatPrice(DELIVERY_FEE)} · suivi en direct</Text> },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))} hitSlop={8} style={styles.round} accessibilityLabel="Retour">
          <Text style={{ fontSize: 18, color: colors.ink }}>←</Text>
        </Pressable>
        <Text style={styles.title}>Comparer</Text>
        {products.length > 0 ? (
          <Pressable onPress={clear} hitSlop={8}><Text style={styles.clear}>Tout retirer</Text></Pressable>
        ) : <View style={{ width: 40 }} />}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        {/* The 3D idea, visible from day one */}
        <View style={styles.soon}>
          <Text style={styles.cube}>⬡</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.soonTitle}>Bientôt : la vue 3D</Text>
            <Text style={styles.soonText}>Faites tourner les pièces en 3D et comparez-les côte à côte, comme en boutique.</Text>
          </View>
        </View>

        {loading ? (
          <Text style={styles.empty}>Chargement…</Text>
        ) : products.length === 0 ? (
          <View style={{ padding: 24, gap: 10 }}>
            <Text style={styles.emptyTitle}>Aucune pièce à comparer</Text>
            <Text style={styles.empty}>Sur une pièce qui vous plaît, touchez « ⇄ Comparer ». Vous pouvez comparer jusqu'à {MAX_COMPARE} pièces.</Text>
            <Pressable onPress={() => router.replace("/(tabs)/explore")} style={styles.cta}><Text style={styles.ctaText}>Explorer les pièces</Text></Pressable>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
            {products.map((p) => (
              <View key={p.id} style={{ width: colW }}>
                <Pressable onPress={() => router.push({ pathname: "/product/[id]", params: { id: p.id } })}>
                  <Image source={{ uri: p.images[0] }} style={styles.img} contentFit="cover" />
                </Pressable>
                <Pressable onPress={() => remove(p.id)} style={styles.x} hitSlop={6} accessibilityLabel="Retirer">
                  <Text style={{ color: colors.ink, fontSize: 14 }}>✕</Text>
                </Pressable>
                <Text numberOfLines={2} style={styles.name}>{p.name}</Text>

                {rows.map((r) => (
                  <View key={r.label} style={styles.cell}>
                    <Text style={styles.label}>{r.label}</Text>
                    {r.render(p)}
                  </View>
                ))}

                <Pressable onPress={() => router.push({ pathname: "/product/[id]", params: { id: p.id } })} style={[styles.cta, { marginTop: 12 }]}>
                  <Text style={styles.ctaText}>Voir la pièce</Text>
                </Pressable>
              </View>
            ))}
            {products.length < MAX_COMPARE ? (
              <Pressable onPress={() => router.push("/(tabs)/explore")} style={[styles.addCol, { width: colW }]}>
                <Text style={{ fontSize: 28, color: colors.muted }}>＋</Text>
                <Text style={styles.sub}>Ajouter une pièce</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

function Tag({ text, tone }: { text: string; tone: "good" | "hot" }) {
  return (
    <View style={[styles.tag, tone === "good" ? { backgroundColor: "#E6F5EC" } : { backgroundColor: "#FFF1E0" }]}>
      <Text style={[styles.tagText, { color: tone === "good" ? "#0F7A3D" : "#B45309" }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 8 },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.mist, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "700", color: colors.ink, letterSpacing: -0.4 },
  clear: { fontSize: 13, color: colors.muted, fontWeight: "600" },
  soon: { flexDirection: "row", gap: 12, alignItems: "center", margin: 16, padding: 14, borderRadius: radius.md, backgroundColor: colors.ink },
  cube: { fontSize: 30, color: colors.amber },
  soonTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  soonText: { color: "#CFC8D9", fontSize: 13, marginTop: 2, lineHeight: 18 },
  img: { width: "100%", aspectRatio: 3 / 4, borderRadius: radius.md, backgroundColor: colors.mist },
  x: { position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" },
  name: { fontSize: 15, fontWeight: "700", color: colors.ink, marginTop: 8, minHeight: 40 },
  cell: { borderTopWidth: 1, borderTopColor: colors.line, paddingVertical: 10, minHeight: 64 },
  label: { fontSize: 11, color: colors.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3 },
  val: { fontSize: 14, color: colors.ink, fontWeight: "600" },
  big: { fontSize: 17, color: colors.ink, fontWeight: "700" },
  strike: { fontSize: 12, color: colors.muted, textDecorationLine: "line-through" },
  sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  tag: { alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 3, marginTop: 5 },
  tagText: { fontSize: 11, fontWeight: "700" },
  addCol: { borderWidth: 1, borderStyle: "dashed", borderColor: colors.line, borderRadius: radius.md, alignItems: "center", justifyContent: "center", gap: 4, aspectRatio: 3 / 4 },
  cta: { backgroundColor: colors.ink, height: 44, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  empty: { color: colors.muted, fontSize: 14, textAlign: "center", padding: 12 },
  emptyTitle: { color: colors.ink, fontSize: 17, fontWeight: "700", textAlign: "center" },
});
