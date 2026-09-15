import { supabase } from "./supabase";
import { mockBrands, mockProducts } from "./mock";
import type { Brand, Product } from "./types";

// "mock" until the Weslet tables are mapped below, then "supabase".
const SOURCE = process.env.EXPO_PUBLIC_DATA_SOURCE ?? "mock";

// ------------------------------------------------------------------
// SUPABASE MAPPING — adjust these to the real Weslet schema.
// Expected: a products table with a brand relation. Column names below
// are guesses; change them in one place (rowToProduct) once the schema
// is pasted in.
// ------------------------------------------------------------------
const PRODUCT_SELECT = `
  id, name, price, description, images, video_url, category, variants,
  brand:brands ( id, name, slug, city, logo_url )
`;

function rowToProduct(r: any): Product {
  const brand = r.brand ?? {};
  return {
    id: String(r.id),
    name: r.name ?? "",
    price: Number(r.price ?? 0),
    description: r.description ?? null,
    images: Array.isArray(r.images) ? r.images : r.image_url ? [r.image_url] : [],
    videoUrl: r.video_url ?? null,
    category: r.category ?? null,
    variants: Array.isArray(r.variants) ? r.variants : [],
    brand: {
      id: String(brand.id ?? ""),
      name: brand.name ?? "",
      slug: brand.slug ?? "",
      city: brand.city ?? null,
      logoUrl: brand.logo_url ?? null,
    },
  };
}

export async function fetchFeed(): Promise<Product[]> {
  if (SOURCE === "mock") return mockProducts;
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: false })
    .limit(40);
  if (error) throw error;
  return (data ?? []).map(rowToProduct);
}

export async function searchProducts(q: string, category: string | null): Promise<Product[]> {
  if (SOURCE === "mock") {
    const s = q.trim().toLowerCase();
    return mockProducts.filter(
      (p) =>
        (!category || p.category === category) &&
        (!s || p.name.toLowerCase().includes(s) || p.brand.name.toLowerCase().includes(s)),
    );
  }
  let query = supabase.from("products").select(PRODUCT_SELECT).limit(60);
  if (category) query = query.eq("category", category);
  if (q.trim()) query = query.ilike("name", `%${q.trim()}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToProduct);
}

export async function fetchProduct(id: string): Promise<Product | null> {
  if (SOURCE === "mock") return mockProducts.find((p) => p.id === id) ?? null;
  const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).eq("id", id).single();
  if (error) return null;
  return rowToProduct(data);
}

export async function fetchBrands(): Promise<Brand[]> {
  if (SOURCE === "mock") return mockBrands;
  const { data, error } = await supabase.from("brands").select("id, name, slug, city, logo_url").limit(50);
  if (error) throw error;
  return (data ?? []).map((b: any) => ({
    id: String(b.id), name: b.name, slug: b.slug, city: b.city ?? null, logoUrl: b.logo_url ?? null,
  }));
}

export const CATEGORIES = ["Femme", "Homme", "Accessoires"];
