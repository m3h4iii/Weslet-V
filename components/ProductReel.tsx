import { useEffect, useRef, useState } from "react";
import { Animated, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCart } from "@/lib/cart";
import { usePrefs } from "@/lib/prefs";
import { shareProduct } from "@/lib/share";
import { colors, formatPrice, radius } from "@/lib/theme";
import type { Product } from "@/lib/types";

type Props = { product: Product; height: number; active: boolean };

const DOUBLE_TAP_MS = 280;

export function ProductReel({ product, height, active }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { add } = useCart();
  const { isFavorite, toggleFavorite } = usePrefs();
  const liked = isFavorite(product.id);
  const [photo, setPhoto] = useState(0);
  const lastTap = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heart = useRef(new Animated.Value(0)).current;

  const open = () => router.push({ pathname: "/product/[id]", params: { id: product.id } });
  const openBoutique = () => router.push({ pathname: "/boutique/[id]", params: { id: product.brand.id } });

  const burstHeart = () => {
    heart.setValue(0);
    Animated.sequence([
      Animated.spring(heart, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 12 }),
      Animated.delay(350),
      Animated.timing(heart, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const like = () => {
    const now = toggleFavorite(product);
    Haptics.selectionAsync().catch(() => {});
    if (now) burstHeart();
  };

  // Single tap → open the piece; double tap → like (Instagram-style)
  const onTap = () => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = null;
      lastTap.current = 0;
      if (!liked) toggleFavorite(product);
      Haptics.selectionAsync().catch(() => {});
      burstHeart();
      return;
    }
    lastTap.current = now;
    tapTimer.current = setTimeout(() => { tapTimer.current = null; open(); }, DOUBLE_TAP_MS);
  };

  const addToBag = () => {
    if (product.variants.length > 0 || product.stock <= 0) return open();
    add(product, null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const photos = product.images.length > 0 ? product.images : [""];

  return (
    <View style={{ height, backgroundColor: colors.ink }}>
      {product.videoUrl ? (
        <ReelVideo uri={product.videoUrl} poster={product.images[0]} active={active} />
      ) : photos.length > 1 ? (
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(u, i) => `${i}-${u}`}
          onMomentumScrollEnd={(e) => setPhoto(Math.round(e.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <Pressable onPress={onTap} style={{ width, height }}>
              <Image source={{ uri: item }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
            </Pressable>
          )}
        />
      ) : (
        <Pressable onPress={onTap} style={StyleSheet.absoluteFill}>
          <Image source={{ uri: photos[0] }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
        </Pressable>
      )}

      <LinearGradient colors={["rgba(23,18,31,0)", "rgba(23,18,31,0.75)"]} style={styles.scrim} pointerEvents="none" />

      {/* video reels: the whole surface is tappable */}
      {product.videoUrl ? <Pressable style={StyleSheet.absoluteFill} onPress={onTap} /> : null}

      <Animated.View pointerEvents="none" style={[styles.burst, { opacity: heart, transform: [{ scale: heart.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }]}>
        <Text style={styles.burstHeart}>♥</Text>
      </Animated.View>

      {photos.length > 1 && !product.videoUrl && (
        <View style={styles.dots} pointerEvents="none">
          {photos.map((_, i) => <View key={i} style={[styles.dot, i === photo && styles.dotOn]} />)}
        </View>
      )}

      <View style={styles.rail}>
        <RailButton label={liked ? "♥" : "♡"} tint={liked ? colors.pink : "#fff"} onPress={like} />
        <RailButton label="↗" onPress={() => shareProduct(product)} />
        <RailButton label="+" onPress={addToBag} />
      </View>

      <View style={styles.info}>
        <Pressable onPress={openBoutique} hitSlop={6} style={{ alignSelf: "flex-start" }}>
          <Text style={styles.brand}>{product.brand.name}{product.brand.city ? ` · ${product.brand.city}` : ""} ›</Text>
        </Pressable>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
          {product.compareAt && product.compareAt > product.price ? <Text style={styles.compare}>{formatPrice(product.compareAt)}</Text> : null}
        </View>
        {product.variants.length > 0 ? (
          <Text style={styles.sizes} numberOfLines={1}>Tailles : {product.variants.join(" · ")}</Text>
        ) : null}
        <Pressable onPress={open} style={styles.buy}>
          <Text style={styles.buyText}>{product.stock <= 0 ? "Épuisé" : "Acheter"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ReelVideo({ uri, poster, active }: { uri: string; poster?: string; active: boolean }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });
  useEffect(() => {
    if (active) player.play(); else player.pause();
  }, [active, player]);
  return (
    <View style={StyleSheet.absoluteFill}>
      {poster ? <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
    </View>
  );
}

function RailButton({ label, onPress, tint = "#fff" }: { label: string; onPress: () => void; tint?: string }) {
  return (
    <Pressable onPress={onPress} style={styles.railBtn} hitSlop={8}>
      <Text style={[styles.railText, { color: tint }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "55%" },
  burst: { position: "absolute", left: 0, right: 0, top: "38%", alignItems: "center" },
  burstHeart: { color: "#fff", fontSize: 96, textShadowColor: "rgba(0,0,0,0.35)", textShadowRadius: 18 },
  dots: { position: "absolute", top: 60, left: 0, right: 0, flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.45)" },
  dotOn: { backgroundColor: "#fff", width: 18 },
  rail: { position: "absolute", right: 14, bottom: 150, gap: 14, alignItems: "center" },
  railBtn: {
    width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)",
  },
  railText: { color: "#fff", fontSize: 22, lineHeight: 26 },
  info: { position: "absolute", left: 18, right: 90, bottom: 28 },
  brand: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },
  name: { color: "#fff", fontSize: 30, fontWeight: "700", letterSpacing: -0.6, lineHeight: 34, marginTop: 4 },
  price: { color: "#fff", fontSize: 17, marginTop: 4 },
  compare: { color: "rgba(255,255,255,0.6)", fontSize: 14, textDecorationLine: "line-through" },
  sizes: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 4 },
  buy: {
    alignSelf: "flex-start", marginTop: 14, backgroundColor: "#fff",
    paddingHorizontal: 20, paddingVertical: 11, borderRadius: radius.pill,
  },
  buyText: { color: colors.ink, fontWeight: "700", fontSize: 15 },
});
