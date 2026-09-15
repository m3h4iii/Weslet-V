import { Pressable, Text, View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { colors, formatPrice, radius } from "@/lib/theme";
import type { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={{ pathname: "/product/[id]", params: { id: product.id } }} asChild>
      <Pressable style={styles.card}>
        <Image source={{ uri: product.images[0] }} style={styles.img} contentFit="cover" transition={200} />
        <View style={styles.cap}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={styles.name}>{product.name}</Text>
            <Text numberOfLines={1} style={styles.brand}>{product.brand.name}</Text>
          </View>
          <Text style={styles.price}>{formatPrice(product.price)}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  img: { aspectRatio: 3 / 4, borderRadius: radius.md, backgroundColor: colors.mist },
  cap: { flexDirection: "row", gap: 8, paddingTop: 8, alignItems: "flex-start" },
  name: { fontSize: 14, fontWeight: "600", color: colors.ink },
  brand: { fontSize: 12, color: colors.muted, marginTop: 1 },
  price: { fontSize: 13, fontWeight: "600", color: colors.ink },
});
