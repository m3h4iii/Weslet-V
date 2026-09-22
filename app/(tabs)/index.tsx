import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, ViewToken, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Wordmark } from "@/components/Logo";
import { ProductReel } from "@/components/ProductReel";
import { fetchFeed, fitsSizes } from "@/lib/data";
import { usePrefs } from "@/lib/prefs";
import { Skeleton } from "@/components/Skeleton";
import { colors } from "@/lib/theme";
import type { Product } from "@/lib/types";

export default function FeedScreen() {
  const { height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const TAB_BAR = 64; // keep in sync with (tabs)/_layout.tsx
  const itemH = winH - TAB_BAR - insets.bottom;

  const router = useRouter();
  const { sizes, sizeFilter, setSizeFilter, seen, markSeen, ready: prefsReady } = usePrefs();
  const seenSet = useRef(new Set<string>());
  useEffect(() => { seenSet.current = new Set(seen); }, [seen]);
  const [order, setOrder] = useState<string[] | null>(null); // frozen order for this session
  const [all, setAll] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<FlatList<Product>>(null);
  const lastLoad = useRef(0);

  const load = useCallback(async () => {
    try {
      const rows = await fetchFeed();
      const seen = new Set<string>();
      setAll(rows.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true))));
      lastLoad.current = Date.now();
    } catch {
      /* keep what we have */
    }
  }, []);

  const filterOn = sizeFilter && sizes.length > 0;
  const base = filterOn ? all.filter((p) => fitsSizes(p, sizes)) : all;

  // Unseen pieces first, then the ones already scrolled past — decided once per load
  // so the list doesn't reshuffle under the thumb while marking items seen.
  useEffect(() => {
    if (!prefsReady || all.length === 0) return;
    const s = new Set(seenSet.current);
    const unseen = all.filter((p) => !s.has(p.id)).map((p) => p.id);
    const old = all.filter((p) => s.has(p.id)).map((p) => p.id);
    setOrder([...unseen, ...old]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, prefsReady]);

  const items = (() => {
    if (!order) return base;
    const byId = new Map(base.map((p) => [p.id, p]));
    return order.map((id) => byId.get(id)).filter((p): p is Product => !!p);
  })();
  const unseenCount = items.filter((p) => !seenSet.current.has(p.id)).length;

  const onSizeChip = () => {
    if (sizes.length === 0) return router.push("/sizes");
    setSizeFilter(!sizeFilter);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  // Coming back to the tab after a while → silently refetch (new pieces, updated stock)
  useFocusEffect(useCallback(() => {
    if (Date.now() - lastLoad.current > 60_000) load();
  }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [load]);

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems.find((v) => v.isViewable);
    if (first?.index != null) {
      setActive(first.index);
      const p = first.item as Product | undefined;
      if (p?.id) { seenSet.current.add(p.id); markSeen(p.id); }
    }
  }).current;

  const renderItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => (
      <ProductReel product={item} height={itemH} active={index === active} />
    ),
    [itemH, active],
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ink }}>
        <Skeleton style={{ flex: 1, borderRadius: 0, backgroundColor: "#2A2335" }} />
        <View style={{ position: "absolute", left: 18, right: 90, bottom: 60, gap: 10 }}>
          <Skeleton style={{ height: 12, width: 110, backgroundColor: "#3A3347" }} />
          <Skeleton style={{ height: 28, width: 220, backgroundColor: "#3A3347" }} />
          <Skeleton style={{ height: 14, width: 70, backgroundColor: "#3A3347" }} />
        </View>
        <View style={[styles.header, { top: insets.top + 8 }]} pointerEvents="none">
          <Wordmark light />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.ink }}>
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" colors={[colors.pink]} progressViewOffset={insets.top + 8} />}
        pagingEnabled
        snapToInterval={itemH}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        getItemLayout={(_, i) => ({ length: itemH, offset: itemH * i, index: i })}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        windowSize={3}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={[styles.center, { height: itemH, padding: 30, gap: 14 }]}>
            <Text style={styles.emptyText}>{filterOn ? "Rien dans vos tailles pour l'instant." : "Aucune pièce en ligne."}</Text>
            {filterOn ? (
              <Pressable onPress={() => setSizeFilter(false)} style={styles.emptyBtn}><Text style={styles.emptyBtnText}>Voir toutes les pièces</Text></Pressable>
            ) : null}
          </View>
        }
      />
      <View style={[styles.header, { top: insets.top + 8 }]} pointerEvents="none">
        <Wordmark light />
      </View>
      {active > 0 && unseenCount === 0 && items.length > 3 ? (
        <Pressable onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })} style={[styles.toTop, { top: insets.top + 50 }]}>
          <Text style={styles.toTopText}>Tout vu · revenir au début ↑</Text>
        </Pressable>
      ) : null}
      <View style={[styles.tools, { top: insets.top + 6 }]}>
        <Pressable onPress={onSizeChip} onLongPress={() => router.push("/sizes")} hitSlop={6} style={[styles.sizeChip, filterOn && styles.sizeChipOn]}>
          <Text style={[styles.sizeChipText, filterOn && { color: colors.ink }]}>
            {sizes.length === 0 ? "Ma taille" : filterOn ? `Ma taille ✓` : "Ma taille"}
          </Text>
        </Pressable>
        <Pressable onPress={onRefresh} disabled={refreshing} hitSlop={10} style={styles.refresh}>
          {refreshing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.refreshText}>↻</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { position: "absolute", left: 18 },
  tools: { position: "absolute", right: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  sizeChip: {
    height: 36, paddingHorizontal: 14, borderRadius: 18, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)",
  },
  sizeChipOn: { backgroundColor: "#fff", borderColor: "#fff" },
  sizeChipText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  refresh: {
    width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)",
  },
  toTop: { position: "absolute", alignSelf: "center", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.45)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  toTopText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  emptyText: { color: "#fff", fontSize: 16, textAlign: "center" },
  emptyBtn: { backgroundColor: "#fff", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  emptyBtnText: { color: colors.ink, fontWeight: "700" },
  refreshText: { color: "#fff", fontSize: 20, lineHeight: 22 },
});
