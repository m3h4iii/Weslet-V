import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "@/lib/theme";

export function Skeleton({ style }: { style?: ViewStyle | ViewStyle[] }) {
  const o = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(o, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(o, { toValue: 0.5, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [o]);
  return <Animated.View style={[styles.base, style, { opacity: o }]} />;
}

/** Two-column grid placeholder for Explore / boutique pages. */
export function GridSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <View style={{ padding: 16, gap: 18 }}>
      {Array.from({ length: rows }).map((_, r) => (
        <View key={r} style={{ flexDirection: "row", gap: 12 }}>
          {[0, 1].map((c) => (
            <View key={c} style={{ flex: 1, gap: 8 }}>
              <Skeleton style={{ aspectRatio: 3 / 4, borderRadius: 16 }} />
              <Skeleton style={{ height: 12, width: "70%" }} />
              <Skeleton style={{ height: 10, width: "40%" }} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({ base: { backgroundColor: colors.mist, borderRadius: 8 } });
