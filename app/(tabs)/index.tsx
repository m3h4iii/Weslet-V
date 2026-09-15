import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, View, ViewToken, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  const [active, setActive] = useState(0);

  useEffect(() => {
    fetchFeed().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

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
        data={items}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
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
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { position: "absolute", left: 18 },
});
