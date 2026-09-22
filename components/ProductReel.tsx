import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useCart } from "@/lib/cart";
import { colors, formatPrice, radius } from "@/lib/theme";
import type { Product } from "@/lib/types";

type Props = { product: Product; height: number; active: boolean };

export function ProductReel({ product, height, active }: Props) {
  const router = useRouter();
  const { add } = useCart();
  const [liked, setLiked] = useState(false);
  const open = () => router.push({ pathname: "/product/[id]", params: { id: product.id } });

  return (
    <View style={{ height, backgroundColor: colors.ink }}>
      {product.videoUrl ? (
        <ReelVideo uri={product.videoUrl} poster={product.images[0]} active={active} />
      ) : (
        <Image source={{ uri: product.images[0] }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      )}

      <LinearGradient colors={["rgba(23,18,31,0)", "rgba(23,18,31,0.75)"]} style={styles.scrim} pointerEvents="none" />

      <Pressable style={StyleSheet.absoluteFill} onPress={open} />

      <View style={styles.rail}>
        <RailButton label={liked ? "♥" : "♡"} onPress={() => { setLiked((v) => !v); Haptics.selectionAsync(); }} />
        <RailButton label="↗" onPress={() => {}} />
        <RailButton
          label="+"
          onPress={() => {
            if (product.variants.length > 0 || product.stock <= 0) return open();
            add(product, null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
        />
      </View>

      <View style={styles.info}>
        <Text style={styles.brand}>{product.brand.name}{product.brand.city ? ` · ${product.brand.city}` : ""}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
        <Pressable onPress={open} style={styles.buy}>
          <Text style={styles.buyText}>Acheter</Text>
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

function RailButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.railBtn} hitSlop={8}>
      <Text style={styles.railText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: "55%" },
  rail: { position: "absolute", right: 14, bottom: 150, gap: 14, alignItems: "center" },
  railBtn: {
    width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)",
  },
  railText: { color: "#fff", fontSize: 22, lineHeight: 26 },
  info: { position: "absolute", left: 18, right: 90, bottom: 28 },
  brand: { color: "rgba(255,255,255,0.8)", fontSize: 13 },
  name: { color: "#fff", fontSize: 30, fontWeight: "700", letterSpacing: -0.6, lineHeight: 34, marginTop: 4 },
  price: { color: "#fff", fontSize: 17, marginTop: 4 },
  buy: {
    alignSelf: "flex-start", marginTop: 14, backgroundColor: "#fff",
    paddingHorizontal: 20, paddingVertical: 11, borderRadius: radius.pill,
  },
  buyText: { color: colors.ink, fontWeight: "700", fontSize: 15 },
});
