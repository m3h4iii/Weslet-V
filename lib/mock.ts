import type { Brand, Post, Product } from "./types";

// Draft data so the app runs before the backend is wired.
// Images: neutral placeholder cards (piece name on a soft background) until real product photos exist.
const b = (id: string, name: string, slug: string, city: string, bio: string): Brand => ({ id, name, slug, city, logoUrl: null, instagram: slug.replace("-", ""), bio });

export const mockBrands: Brand[] = [
  b("b1", "Dar Sabra", "dar-sabra", "Tunis", "Broderie main et lin lavé, cousus à Tunis."),
  b("b2", "Medina Mode", "medina-mode", "Sousse", "Pièces légères pour la ville et la plage."),
  b("b3", "Sfax Atelier", "sfax-atelier", "Sfax", "Maroquinerie pleine fleur, fait main."),
  b("b4", "Nour & Co", "nour-co", "La Marsa", "Bijoux dorés inspirés du jasmin."),
  b("b5", "Atelier Nabeul", "atelier-nabeul", "Nabeul", "Chemises et foulards brodés."),
  b("b6", "Kairouan Studio", "kairouan-studio", "Kairouan", "La chéchia, revisitée."),
];

const TONES = ["EDE7F9", "F9E4EC", "FBF0DC", "E6EEF8", "EEE9E3"];
const img = (label: string, n: number, w = 900, h = 1600) =>
  `https://placehold.co/${w}x${h}/${TONES[n % TONES.length]}/6E6678.png?text=${encodeURIComponent(label)}&font=montserrat`;

const p = (
  id: string, name: string, price: number, brand: Brand, _tag: string, n: number,
  category: string, variants: string[] = [], description: string | null = null,
): Product => ({
  id, name, price, brand, category, variants, description, videoUrl: null, compareAt: null, stock: 10, variantIds: {}, variantStock: {},
  images: [img(name, n), img(`${name} · 2`, n + 1), img(`${name} · 3`, n + 2)],
});

export const mockProducts: Product[] = [
  p("p1", "Veste brodée", 189, mockBrands[0], "jacket", 1, "Femme", ["S", "M", "L"], "Broderie main sur lin épais. Coupe droite."),
  p("p2", "Robe lin blanc", 145, mockBrands[1], "dress", 2, "Femme", ["S", "M", "L"], "Lin lavé, manches courtes. Se porte pieds nus ou avec des sandales."),
  p("p3", "Sac cuir Sidi Bou", 220, mockBrands[2], "handbag", 3, "Accessoires", ["Camel", "Noir"], "Cuir pleine fleur, fait main à Sfax."),
  p("p4", "Boucles Jasmin", 65, mockBrands[3], "earrings", 4, "Accessoires", [], "Laiton doré, motif jasmin."),
  p("p5", "Chemise rayée", 95, mockBrands[4], "shirt", 5, "Homme", ["M", "L", "XL"]),
  p("p6", "Chéchia moderne", 40, mockBrands[5], "hat", 6, "Accessoires", []),
  p("p7", "Pantalon large", 130, mockBrands[0], "trousers", 7, "Femme", ["36", "38", "40"]),
  p("p8", "Collier perles", 80, mockBrands[3], "necklace", 8, "Accessoires", []),
  p("p9", "Sandales cuir", 110, mockBrands[2], "sandals", 9, "Homme", ["40", "41", "42", "43"]),
  p("p10", "Kimono soie", 210, mockBrands[1], "kimono", 10, "Femme", ["Unique"]),
  p("p11", "Foulard brodé", 55, mockBrands[4], "scarf", 11, "Accessoires", []),
  p("p12", "Caftan court", 260, mockBrands[0], "caftan", 12, "Femme", ["S", "M"]),
];

// Feed posts: two posts for the first piece to show that stock stays in sync across posts.
export const mockPosts: Post[] = [
  // Set EXPO_PUBLIC_MOCK_VIDEO to an mp4 URL to preview a video reel in mock mode.
  process.env.EXPO_PUBLIC_MOCK_VIDEO
    ? { id: "post-1a", kind: "video", url: process.env.EXPO_PUBLIC_MOCK_VIDEO, poster: mockProducts[0].images[0], caption: "Nouvelle collection · dispo en S / M / L", createdAt: "2026-09-20T10:00:00Z", product: mockProducts[0] }
    : { id: "post-1a", kind: "image", url: mockProducts[0].images[0], poster: null, caption: "Nouvelle collection · dispo en S / M / L", createdAt: "2026-09-20T10:00:00Z", product: mockProducts[0] },
  ...mockProducts.slice(1).map((pr, i) => ({
    id: `post-${pr.id}`, kind: "image" as const, url: pr.images[0], poster: null, caption: null,
    createdAt: new Date(Date.parse("2026-09-19T10:00:00Z") - i * 3600_000).toISOString(), product: pr,
  })),
  process.env.EXPO_PUBLIC_MOCK_VIDEO_2
    ? { id: "post-1b", kind: "video", url: process.env.EXPO_PUBLIC_MOCK_VIDEO_2, poster: mockProducts[0].images[1], caption: "Vue de dos — même pièce, même stock", createdAt: "2026-09-18T10:00:00Z", product: mockProducts[0] }
    : { id: "post-1b", kind: "image", url: mockProducts[0].images[1], poster: null, caption: "Vue de dos — même pièce, même stock", createdAt: "2026-09-18T10:00:00Z", product: mockProducts[0] },
];
