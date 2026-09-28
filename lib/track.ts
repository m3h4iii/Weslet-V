import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { IS_MOCK } from "./data";
import type { Post, Product } from "./types";

// Anonymous analytics for boutiques: what gets seen, added to cart, shared.
// No account needed; a random device id ties events together, never a person.

type Kind = "post_view" | "product_view" | "add_to_cart" | "share";

let deviceId: string | null = null;
const seenThisSession = new Set<string>();

async function getDeviceId(): Promise<string> {
  if (deviceId) return deviceId;
  try {
    const stored = await AsyncStorage.getItem("weslet.device.v1");
    if (stored) return (deviceId = stored);
  } catch {}
  const id = `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  deviceId = id;
  AsyncStorage.setItem("weslet.device.v1", id).catch(() => {});
  return id;
}

async function send(kind: Kind, product: Product, postId?: string) {
  if (IS_MOCK || !product.brand.id) return;
  try {
    const device_id = await getDeviceId();
    await supabase.from("events").insert({ kind, merchant_id: product.brand.id, product_id: product.id, post_id: postId ?? null, device_id });
  } catch {
    /* analytics never block the UI */
  }
}

/** Once per post per app session (a reel counted when it becomes the active one). */
export function trackPostView(post: Post) {
  const key = `post:${post.id}`;
  if (seenThisSession.has(key)) return;
  seenThisSession.add(key);
  send("post_view", post.product, post.id.startsWith("product-") ? undefined : post.id);
}

export function trackProductView(product: Product) {
  const key = `product:${product.id}`;
  if (seenThisSession.has(key)) return;
  seenThisSession.add(key);
  send("product_view", product);
}

export const trackAddToCart = (product: Product) => send("add_to_cart", product);
export const trackShare = (product: Product) => send("share", product);
