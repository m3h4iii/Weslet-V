import { Platform, Share } from "react-native";
import type { Product } from "./types";

// Public web address of the app (Netlify). On web we use the page's own origin;
// in Expo Go / native builds set EXPO_PUBLIC_WEB_URL (e.g. https://weslet.netlify.app).
export function webBase(): string {
  if (Platform.OS === "web" && typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return (process.env.EXPO_PUBLIC_WEB_URL || "https://weslet.netlify.app").replace(/\/$/, "");
}

export const productUrl = (id: string) => `${webBase()}/product/${id}`;
export const boutiqueUrl = (id: string) => `${webBase()}/boutique/${id}`;

export async function shareProduct(p: Product) {
  const url = productUrl(p.id);
  const message = `${p.name} · ${p.brand.name} — ${p.price.toLocaleString("fr-TN")} DT sur Weslet\n${url}`;
  try {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && (navigator as any).share) {
      await (navigator as any).share({ title: p.name, text: message, url });
      return;
    }
    await Share.share(Platform.OS === "ios" ? { message, url } : { message });
  } catch {
    /* user cancelled */
  }
}

export async function shareBoutique(name: string, id: string) {
  const url = boutiqueUrl(id);
  const message = `${name} sur Weslet\n${url}`;
  try {
    if (Platform.OS === "web" && typeof navigator !== "undefined" && (navigator as any).share) {
      await (navigator as any).share({ title: name, text: message, url });
      return;
    }
    await Share.share(Platform.OS === "ios" ? { message, url } : { message });
  } catch {}
}
