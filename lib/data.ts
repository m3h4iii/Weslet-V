import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import { mockBrands, mockProducts } from "./mock";
import { DELIVERY_FEE } from "./address";
import type { Address, Brand, CartLine, Category, Order, OrderStatus, Product } from "./types";

// "mock" until the Supabase keys are set, then "supabase".
export const SOURCE = process.env.EXPO_PUBLIC_DATA_SOURCE ?? "mock";
export const IS_MOCK = SOURCE !== "supabase";

const toDinars = (millimes: any) => Number(millimes ?? 0) / 1000;

// ------------------------------------------------------------------
// PRODUCTS — real Weslet schema (01_schema.sql):
//   products(id, merchant_id, category_id, title, description, price_millimes,
//            compare_at_millimes, stock_qty, images text[], status)
//   merchants(id, name, slug, city, logo_url, status)
//   categories(id, slug, name_fr)
//   product_variants(id, product_id, name, stock_qty) — optional (06 migration)
// ------------------------------------------------------------------
const PRODUCT_SELECT = `
  id, merchant_id, title, description, price_millimes, compare_at_millimes, stock_qty, images, video_url, status,
  category:categories ( id, slug, name_fr ),
  merchant:merchants ( id, name, slug, city, logo_url )
`;
// video_url is not in the base schema; if the select fails on it we retry without it.
const PRODUCT_SELECT_NO_VIDEO = PRODUCT_SELECT.replace("video_url, ", "");

function rowToProduct(r: any): Product {
  const m = r.merchant ?? {};
  return {
    id: String(r.id),
    name: r.title ?? "",
    price: toDinars(r.price_millimes),
    compareAt: r.compare_at_millimes != null ? toDinars(r.compare_at_millimes) : null,
    stock: Number(r.stock_qty ?? 0),
    description: r.description ?? null,
    images: Array.isArray(r.images) ? r.images : [],
    videoUrl: r.video_url ?? null,
    category: r.category?.slug ?? null,
    variants: [],
    variantIds: {},
    brand: {
      id: String(m.id ?? r.merchant_id ?? ""),
      name: m.name ?? "",
      slug: m.slug ?? "",
      city: m.city ?? null,
      logoUrl: m.logo_url ?? null,
    },
  };
}

async function selectProducts(build: (sel: string) => any): Promise<Product[]> {
  let { data, error } = await build(PRODUCT_SELECT);
  if (error && /video_url/i.test(error.message ?? "")) ({ data, error } = await build(PRODUCT_SELECT_NO_VIDEO));
  if (error) throw error;
  const products = (data ?? []).map(rowToProduct);
  await attachVariants(products);
  return products;
}

// Sizes live in product_variants once migration 06 is applied. Best effort:
// if the table is missing, products simply have no variants.
async function attachVariants(products: Product[]) {
  if (products.length === 0) return;
  const { data, error } = await supabase
    .from("product_variants")
    .select("id, product_id, name, stock_qty, sort_order")
    .in("product_id", products.map((p) => p.id))
    .order("sort_order", { ascending: true });
  if (error || !data) return;
  const byProduct = new Map<string, Product>(products.map((p) => [p.id, p]));
  for (const v of data as any[]) {
    const p = byProduct.get(String(v.product_id));
    if (!p) continue;
    if (Number(v.stock_qty ?? 0) <= 0) continue;
    p.variants.push(v.name);
    p.variantIds[v.name] = String(v.id);
  }
}

export async function fetchFeed(): Promise<Product[]> {
  if (IS_MOCK) return mockProducts;
  return selectProducts((sel) =>
    supabase.from("products").select(sel).eq("status", "active").order("created_at", { ascending: false }).limit(40),
  );
}

let categoryCache: Category[] | null = null;

export async function fetchCategories(): Promise<Category[]> {
  if (IS_MOCK) return ["Femme", "Homme", "Accessoires"].map((c) => ({ id: null, slug: c, label: c }));
  if (categoryCache) return categoryCache;
  const { data, error } = await supabase.from("categories").select("id, slug, name_fr").order("sort_order", { ascending: true });
  if (error) throw error;
  categoryCache = (data ?? []).map((c: any) => ({ id: c.id, slug: c.slug, label: c.name_fr }));
  return categoryCache;
}

export async function searchProducts(q: string, category: string | null): Promise<Product[]> {
  const s = q.trim();
  if (IS_MOCK) {
    const l = s.toLowerCase();
    return mockProducts.filter(
      (p) =>
        (!category || p.category === category) &&
        (!l || p.name.toLowerCase().includes(l) || p.brand.name.toLowerCase().includes(l)),
    );
  }
  let categoryId: number | null = null;
  if (category) {
    const cats = await fetchCategories();
    categoryId = cats.find((c) => c.slug === category)?.id ?? null;
  }
  return selectProducts((sel) => {
    let query = supabase.from("products").select(sel).eq("status", "active").order("created_at", { ascending: false }).limit(60);
    if (categoryId != null) query = query.eq("category_id", categoryId);
    if (s) query = query.ilike("title", `%${s}%`);
    return query;
  });
}

export async function fetchProduct(id: string): Promise<Product | null> {
  if (IS_MOCK) return mockProducts.find((p) => p.id === id) ?? null;
  try {
    const rows = await selectProducts((sel) => supabase.from("products").select(sel).eq("id", id).limit(1));
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function fetchBrands(): Promise<Brand[]> {
  if (IS_MOCK) return mockBrands;
  const { data, error } = await supabase.from("merchants").select("id, name, slug, city, logo_url").eq("status", "active").limit(50);
  if (error) throw error;
  return (data ?? []).map((b: any) => ({
    id: String(b.id), name: b.name, slug: b.slug, city: b.city ?? null, logoUrl: b.logo_url ?? null,
  }));
}

// ------------------------------------------------------------------
// ORDERS — one order per boutique (place_order RPC, 02_place_order.sql)
// ------------------------------------------------------------------
export function groupByMerchant(lines: CartLine[]): { brand: Brand; lines: CartLine[]; subtotal: number }[] {
  const groups = new Map<string, { brand: Brand; lines: CartLine[]; subtotal: number }>();
  for (const l of lines) {
    const g = groups.get(l.product.brand.id) ?? { brand: l.product.brand, lines: [], subtotal: 0 };
    g.lines.push(l);
    g.subtotal += l.qty * l.product.price;
    groups.set(l.product.brand.id, g);
  }
  return [...groups.values()];
}

export function orderTotals(lines: CartLine[]) {
  const groups = groupByMerchant(lines);
  const subtotal = groups.reduce((n, g) => n + g.subtotal, 0);
  const delivery = groups.length * DELIVERY_FEE;
  return { groups, subtotal, delivery, total: subtotal + delivery };
}

/** Places one order per boutique. Returns the created order ids (in cart order). */
export async function placeOrders(lines: CartLine[], address: Address): Promise<string[]> {
  if (lines.length === 0) throw new Error("Panier vide");
  const groups = groupByMerchant(lines);
  if (IS_MOCK) return placeMockOrders(groups, address);

  const ids: string[] = [];
  for (const g of groups) {
    const items = g.lines.map((l) => ({
      product_id: l.product.id,
      qty: l.qty,
      // Ignored by the v1 RPC, used by the variants-aware v2 RPC once migration 06 is applied.
      variant_id: l.variant ? l.product.variantIds[l.variant] ?? null : null,
      variant_name: l.variant,
    }));
    const { data, error } = await supabase.rpc("place_order", {
      p_merchant_id: g.brand.id,
      p_items: items,
      p_recipient_name: address.recipientName.trim(),
      p_recipient_phone: address.phone.trim(),
      p_governorate: address.governorate,
      p_city: address.city.trim(),
      p_address_line: address.addressLine.trim(),
      p_delivery_notes: address.notes.trim() || null,
    });
    if (error) throw new Error(friendlyError(error.message, g.brand.name));
    ids.push(String(data));
  }
  return ids;
}

function friendlyError(msg: string, boutique: string): string {
  if (/Connexion requise/i.test(msg)) return "Connectez-vous pour commander.";
  if (/Stock insuffisant/i.test(msg)) return `${boutique} : ${msg}`;
  if (/Produit indisponible/i.test(msg)) return `${boutique} : un article n'est plus disponible.`;
  return msg;
}

const ORDER_SELECT = `
  id, order_number, status, created_at, subtotal_millimes, delivery_fee_millimes, total_millimes,
  recipient_name, recipient_phone, governorate, city, address_line, delivery_notes, courier_name, tracking_code,
  merchant:merchants ( id, name ),
  items:order_items ( * ),
  events:order_events ( * )
`;

function rowToOrder(r: any): Order {
  const events = (Array.isArray(r.events) ? r.events : [])
    .map((e: any) => ({
      status: String(e.status ?? e.to_status ?? e.event ?? ""),
      note: e.note ?? e.message ?? null,
      at: String(e.created_at ?? ""),
    }))
    .sort((a: any, b: any) => a.at.localeCompare(b.at));
  return {
    id: String(r.id),
    number: r.order_number ?? "",
    status: (r.status ?? "pending") as OrderStatus,
    createdAt: r.created_at ?? "",
    merchant: { id: String(r.merchant?.id ?? ""), name: r.merchant?.name ?? "Boutique" },
    items: (Array.isArray(r.items) ? r.items : []).map((i: any) => ({
      title: i.title ?? "",
      variant: i.variant_name ?? null,
      qty: Number(i.qty ?? 0),
      unitPrice: toDinars(i.unit_price_millimes),
      lineTotal: toDinars(i.line_total_millimes),
    })),
    subtotal: toDinars(r.subtotal_millimes),
    delivery: toDinars(r.delivery_fee_millimes),
    total: toDinars(r.total_millimes),
    address: {
      recipientName: r.recipient_name ?? "",
      phone: r.recipient_phone ?? "",
      governorate: r.governorate ?? "",
      city: r.city ?? "",
      addressLine: r.address_line ?? "",
      notes: r.delivery_notes ?? "",
    },
    courier: r.courier_name ?? null,
    tracking: r.tracking_code ?? null,
    events,
  };
}

export async function fetchMyOrders(): Promise<Order[]> {
  if (IS_MOCK) return (await loadMockOrders()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const { data, error } = await supabase.from("orders").select(ORDER_SELECT).order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return (data ?? []).map(rowToOrder);
}

export async function fetchOrder(id: string): Promise<Order | null> {
  if (IS_MOCK) return (await loadMockOrders()).find((o) => o.id === id) ?? null;
  const { data, error } = await supabase.from("orders").select(ORDER_SELECT).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return rowToOrder(data);
}

/** Live updates for one order (status changes from the merchant dashboard). Returns an unsubscribe. */
export function subscribeOrder(id: string, onChange: () => void): () => void {
  if (IS_MOCK) return () => {};
  const channel = supabase
    .channel(`order-${id}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `id=eq.${id}` }, onChange)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "order_events", filter: `order_id=eq.${id}` }, onChange)
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}

// ------------------------------------------------------------------
// MOCK ORDERS — stored on the device so the flow can be tested before keys are set
// ------------------------------------------------------------------
const MOCK_ORDERS_KEY = "weslet.orders.mock.v1";

async function loadMockOrders(): Promise<Order[]> {
  try {
    const s = await AsyncStorage.getItem(MOCK_ORDERS_KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

async function placeMockOrders(groups: ReturnType<typeof groupByMerchant>, address: Address): Promise<string[]> {
  const existing = await loadMockOrders();
  const now = new Date().toISOString();
  const created: Order[] = groups.map((g, i) => ({
    id: `mock-${Date.now()}-${i}`,
    number: `TN-${1000 + existing.length + i}`,
    status: "pending",
    createdAt: now,
    merchant: { id: g.brand.id, name: g.brand.name },
    items: g.lines.map((l) => ({
      title: l.product.name, variant: l.variant, qty: l.qty,
      unitPrice: l.product.price, lineTotal: l.qty * l.product.price,
    })),
    subtotal: g.subtotal,
    delivery: DELIVERY_FEE,
    total: g.subtotal + DELIVERY_FEE,
    address,
    courier: null,
    tracking: null,
    events: [{ status: "pending", note: "Commande reçue (mode démo)", at: now }],
  }));
  await AsyncStorage.setItem(MOCK_ORDERS_KEY, JSON.stringify([...existing, ...created]));
  return created.map((o) => o.id);
}
