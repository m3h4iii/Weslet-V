import type { Brand, Product } from "./types";

// Draft data so the app runs before the backend is wired.
// Images: neutral placeholder cards (piece name on a soft background) until real product photos exist.
const b = (id: string, name: string, slug: string, city: string): Brand => ({ id, name, slug, city, logoUrl: null });

export const mockBrands: Brand[] = [
  b("b1", "Dar Sabra", "dar-sabra", "Tunis"),
  b("b2", "Medina Mode", "medina-mode", "Sousse"),
  b("b3", "Sfax Atelier", "sfax-atelier", "Sfax"),
  b("b4", "Nour & Co", "nour-co", "La Marsa"),
  b("b5", "Atelier Nabeul", "atelier-nabeul", "Nabeul"),
  b("b6", "Kairouan Studio", "kairouan-studio", "Kairouan"),
];

const TONES = ["EDE7F9", "F9E4EC", "FBF0DC", "E6EEF8", "EEE9E3"];
const img = (label: string, n: number, w = 900, h = 1600) =>
  `https://placehold.co/${w}x${h}/${TONES[n % TONES.length]}/6E6678.png?text=${encodeURIComponent(label)}&font=montserrat`;

const p = (
  id: string, name: string, price: number, brand: Brand, _tag: string, n: number,
  category: string, variants: string[] = [], description: string | null = null,
): Product => ({
  id, name, price, brand, category, variants, description, videoUrl: null,
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
