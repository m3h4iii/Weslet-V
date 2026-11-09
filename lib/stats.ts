import { supabase } from "./supabase";
import { IS_MOCK } from "./data";

// Light public stats about a product, shown to buyers:
// how many people looked at it, how many bought it, how many saved it.
// Computed in the database by product_public_stats (tapchic_stats.sql).

export type ProductStats = {
  viewers7d: number;  // different devices that viewed it in the last 7 days
  viewingNow: number; // different devices in the last 15 minutes
  sold: number;       // units in orders that were not cancelled or returned
  favorites: number;  // devices that currently have it in their favourites
};

export const EMPTY_STATS: ProductStats = { viewers7d: 0, viewingNow: 0, sold: 0, favorites: 0 };

/** Demo numbers in mock mode, stable for a given product. */
function mockStats(id: string): ProductStats {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return { viewers7d: 20 + (h % 180), viewingNow: h % 7, sold: h % 23, favorites: 3 + (h % 60) };
}

export async function fetchProductStats(ids: string[]): Promise<Record<string, ProductStats>> {
  const out: Record<string, ProductStats> = {};
  if (ids.length === 0) return out;
  if (IS_MOCK) {
    for (const id of ids) out[id] = mockStats(id);
    return out;
  }
  const { data, error } = await supabase.rpc("product_public_stats", { p_ids: ids });
  if (error || !Array.isArray(data)) return out; // SQL not run yet → no stats, the UI just hides them
  for (const r of data as any[]) {
    out[String(r.product_id)] = {
      viewers7d: Number(r.viewers_7d ?? 0),
      viewingNow: Number(r.viewing_now ?? 0),
      sold: Number(r.sold ?? 0),
      favorites: Number(r.favorites ?? 0),
    };
  }
  return out;
}

/** A piece is "popular" once real people show interest; thresholds are deliberately modest for a young app. */
export const isPopular = (s: ProductStats) => s.sold >= 5 || s.viewers7d >= 40 || s.favorites >= 15;
