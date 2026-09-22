import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, ViewToken, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { Wordmark } from "@/components/Logo";
import { ProductReel } from "@/components/ProductReel";
import { fetchFeed } from "@/lib/data";
import { colors } from "@/lib/theme";
import type { Product } from "@/lib/types";

export default function FeedScreen() {
  const { height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const TAB_BAR = 64; // keep in sync with (tabs)/_layout.tsx
  const itemH = winH - TAB_BAR - insets.bottom;

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [active, setActive] = useState(0);
  const listRef = useRef<FlatList<Product>>(null);
  const lastLoad = useRef(0);

  const load = useCallback(async () => {
    try {
      setItems(await fetchFeed());
      lastLoad.current = Date.now();
    } catch {
      /* keep what we have */
    }
  }, []);

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
    if (first?.index != null) setActive(first.index);
  }).current;

  const renderItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => (
      <ProductReel product={item} height={itemH} active={index === active} />
    ),
    [itemH, active],
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.ink }]}>
        <ActivityIndicator color="#fff" />
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
      />
      <View style={[styles.header, { top: insets.top + 8 }]} pointerEvents="none">
        <Wordmark light />
      </View>
      <Pressable onPress={onRefresh} disabled={refreshing} hitSlop={10} style={[styles.refresh, { top: insets.top + 6 }]}>
        {refreshing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.refreshText}>↻</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { position: "absolute", left: 18 },
  refresh: {
    position: "absolute", right: 14, width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)",
  },
  refreshText: { color: "#fff", fontSize: 20, lineHeight: 22 },
});
