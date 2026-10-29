import { supabase } from "./supabase";
import { IS_MOCK } from "./data";
import { mockProducts } from "./mock";
import type { Product } from "./types";

// ------------------------------------------------------------------
// OUTLET — timed drops of last-season pieces.
// Each drop has its own short timer: the price starts at the normal price and
// falls a little every second until the brand's floor, then stops.
// Real data comes from migration 08_outlet.sql:
//   outlet_drops(id, product_id, start_price_millimes, floor_pct, starts_at,
//                duration_sec, stock, status)
//   outlet_locks(id, drop_id, user_id, price_millimes, size, expires_at, status)
//   rpc outlet_drops_today()        → drops of today with sold / held counts
//   rpc outlet_lock(p_drop_id, p_size) → server computes the price, holds it 2 min
//   rpc outlet_cancel(p_lock_id)
// ------------------------------------------------------------------

export const LOCK_SECONDS = 120;

export type OutletDrop = {
  id: string;
  product: Product;
  startPrice: number; // dinars
  floorPct: number;   // 0.40 = price can fall 40 %. Never shown to buyers.
  startsAt: number;   // ms
  durationSec: number;
  stock: number;
  taken: number;      // paid + currently held
};

export type DropState = "upcoming" | "live" | "ended";

export type OutletLock = {
  id: string;
  dropId: string;
  price: number;      // dinars, fixed by the server at lock time
  size: string | null;
  expiresAt: number;  // ms
};

/** Fraction of the drop elapsed, 0 → 1. */
export function dropProgress(d: OutletDrop, now: number): number {
  return Math.min(1, Math.max(0, (now - d.startsAt) / (d.durationSec * 1000)));
}

/** Live price at a moment. Same formula as outlet_lock() on the server. */
export function dropPrice(d: OutletDrop, now: number): number {
  return d.startPrice * (1 - d.floorPct * dropProgress(d, now));
}

export const unitsAvailable = (d: OutletDrop) => Math.max(0, d.stock - d.taken);

export function dropState(d: OutletDrop, now: number): DropState {
  if (now < d.startsAt) return "upcoming";
  if (now >= d.startsAt + d.durationSec * 1000 || unitsAvailable(d) <= 0) return "ended";
  return "live";
}

/** "-12 %" — the discount reached so far. */
export const dropDiscountText = (d: OutletDrop, now: number) => `-${Math.round(d.floorPct * dropProgress(d, now) * 100)} %`;

/** Live prices show millimes so the drop visibly moves every second. */
export const formatLivePrice = (dt: number) => `${dt.toFixed(3).replace(".", ",")} DT`;

export function mmss(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function clockTime(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ---------------- mock ----------------
// A drop every 6 minutes from the start of the current hour, so the demo always
// has something live and something coming up. Stock never moves in mock mode.
const MOCK_FLOORS = [0.4, 0.35, 0.4, 0.3];

function mockDrops(): OutletDrop[] {
  const hour = new Date();
  hour.setMinutes(0, 0, 0);
  const base = hour.getTime();
  const pool = mockProducts.filter((p) => p.price >= 90);
  return Array.from({ length: 10 }, (_, k) => {
    const p = pool[k % pool.length];
    return {
      id: `mock-drop-${k}`,
      product: p,
      startPrice: p.price,
      floorPct: MOCK_FLOORS[k % MOCK_FLOORS.length],
      startsAt: base + k * 6 * 60 * 1000,
      durationSec: 300,
      stock: 3 + (k % 4) * 2,
      taken: 0,
    };
  });
}

let mockLocks: OutletLock[] = [];

// ---------------- real ----------------
const toDinars = (millimes: any) => Number(millimes ?? 0) / 1000;

export async function fetchOutletDrops(): Promise<OutletDrop[]> {
  if (IS_MOCK) return mockDrops();
  const { data, error } = await supabase.rpc("outlet_drops_today");
  if (error) throw error;
  return (data ?? []).map((r: any): OutletDrop => ({
    id: String(r.drop_id),
    startPrice: toDinars(r.start_price_millimes),
    floorPct: Number(r.floor_pct ?? 0),
    startsAt: new Date(r.starts_at).getTime(),
    durationSec: Number(r.duration_sec ?? 300),
    stock: Number(r.stock ?? 0),
    taken: Number(r.taken ?? 0),
    product: {
      id: String(r.product_id),
      name: r.title ?? "",
      price: toDinars(r.start_price_millimes),
      compareAt: null,
      stock: Number(r.stock ?? 0),
      description: r.description ?? null,
      images: Array.isArray(r.images) ? r.images : [],
      videoUrl: null,
      category: null,
      variants: Array.isArray(r.sizes) ? r.sizes : [],
      variantIds: {},
      variantStock: {},
      brand: {
        id: String(r.merchant_id ?? ""),
        name: r.merchant_name ?? "",
        slug: r.merchant_slug ?? "",
        city: r.merchant_city ?? null,
        logoUrl: null,
        instagram: null,
        bio: null,
      },
    },
  }));
}

/** Refresh live counts while the Outlet is open. Returns an unsubscribe function. */
export function subscribeOutlet(onChange: () => void): () => void {
  if (IS_MOCK) return () => {};
  const ch = supabase
    .channel("outlet")
    .on("postgres_changes", { event: "*", schema: "public", table: "outlet_locks" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "outlet_drops" }, onChange)
    .subscribe();
  const poll = setInterval(onChange, 15000);
  return () => { clearInterval(poll); supabase.removeChannel(ch); };
}

/** Hold the current price for this buyer for 2 minutes. The server sets the price. */
export async function lockOutletPrice(drop: OutletDrop, size: string | null): Promise<OutletLock> {
  if (IS_MOCK) {
    const lock: OutletLock = {
      id: `mock-lock-${Date.now()}`,
      dropId: drop.id,
      price: dropPrice(drop, Date.now()),
      size,
      expiresAt: Date.now() + LOCK_SECONDS * 1000,
    };
    mockLocks = [lock, ...mockLocks.filter((l) => l.dropId !== drop.id)];
    return lock;
  }
  const { data, error } = await supabase.rpc("outlet_lock", { p_drop_id: drop.id, p_size: size });
  if (error) throw new Error(friendlyOutletError(error.message));
  const r = Array.isArray(data) ? data[0] : data;
  return {
    id: String(r.lock_id),
    dropId: drop.id,
    price: toDinars(r.price_millimes),
    size,
    expiresAt: new Date(r.expires_at).getTime(),
  };
}

export async function cancelOutletLock(lock: OutletLock): Promise<void> {
  if (IS_MOCK) { mockLocks = mockLocks.filter((l) => l.id !== lock.id); return; }
  await supabase.rpc("outlet_cancel", { p_lock_id: lock.id });
}

function friendlyOutletError(msg: string): string {
  if (/not_live/i.test(msg)) return "Ce drop n'est plus en direct.";
  if (/sold_out/i.test(msg)) return "Trop tard : la dernière pièce vient de partir.";
  if (/auth/i.test(msg)) return "Connectez-vous pour acheter.";
  return "Impossible de bloquer le prix. Réessayez.";
}
