import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Product } from "./types";

// Everything a buyer tells us about themselves without an account:
// favourites, followed boutiques, their sizes, recently viewed pieces.
// Stored on the device; syncing to Supabase can come later without changing the screens.

export const SIZE_GROUPS: { label: string; sizes: string[] }[] = [
  { label: "Vêtements", sizes: ["XS", "S", "M", "L", "XL", "XXL"] },
  { label: "Chaussures", sizes: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"] },
];

type FavSnapshot = { id: string; name: string; price: number; image: string | null; brand: string; addedAt: number };

type PrefsCtx = {
  ready: boolean;
  favorites: FavSnapshot[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (p: Product) => boolean; // returns new state
  follows: string[];
  isFollowing: (brandId: string) => boolean;
  toggleFollow: (brandId: string) => boolean;
  sizes: string[];
  setSizes: (s: string[]) => void;
  sizeFilter: boolean;
  setSizeFilter: (on: boolean) => void;
  recent: string[];
  markViewed: (id: string) => void;
  /** reels the buyer has already scrolled past */
  seen: string[];
  markSeen: (id: string) => void;
  sound: boolean;
  setSound: (on: boolean) => void;
};

const Ctx = createContext<PrefsCtx | null>(null);
const KEY = "weslet.prefs.v1";
const MAX_RECENT = 20;
const MAX_SEEN = 300;

type State = { favorites: FavSnapshot[]; follows: string[]; sizes: string[]; sizeFilter: boolean; recent: string[]; seen: string[]; sound: boolean };
const empty: State = { favorites: [], follows: [], sizes: [], sizeFilter: false, recent: [], seen: [], sound: false };

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(empty);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((s) => s && setState({ ...empty, ...JSON.parse(s) }))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const toggleFavorite = useCallback((p: Product) => {
    let now = false;
    setState((st) => {
      const has = st.favorites.some((f) => f.id === p.id);
      now = !has;
      return {
        ...st,
        favorites: has
          ? st.favorites.filter((f) => f.id !== p.id)
          : [{ id: p.id, name: p.name, price: p.price, image: p.images[0] ?? null, brand: p.brand.name, addedAt: Date.now() }, ...st.favorites],
      };
    });
    return now;
  }, []);

  const toggleFollow = useCallback((brandId: string) => {
    let now = false;
    setState((st) => {
      const has = st.follows.includes(brandId);
      now = !has;
      return { ...st, follows: has ? st.follows.filter((b) => b !== brandId) : [brandId, ...st.follows] };
    });
    return now;
  }, []);

  const markViewed = useCallback((id: string) => {
    setState((st) => {
      if (st.recent[0] === id) return st;
      return { ...st, recent: [id, ...st.recent.filter((r) => r !== id)].slice(0, MAX_RECENT) };
    });
  }, []);

  const markSeen = useCallback((id: string) => {
    setState((st) => {
      if (st.seen.includes(id)) return st;
      return { ...st, seen: [...st.seen, id].slice(-MAX_SEEN) };
    });
  }, []);

  const value = useMemo<PrefsCtx>(() => ({
    ready,
    favorites: state.favorites,
    isFavorite: (id) => state.favorites.some((f) => f.id === id),
    toggleFavorite,
    follows: state.follows,
    isFollowing: (b) => state.follows.includes(b),
    toggleFollow,
    sizes: state.sizes,
    setSizes: (sizes) => setState((st) => ({ ...st, sizes, sizeFilter: sizes.length > 0 ? st.sizeFilter : false })),
    sizeFilter: state.sizeFilter,
    setSizeFilter: (on) => setState((st) => ({ ...st, sizeFilter: on })),
    recent: state.recent,
    markViewed,
    seen: state.seen,
    markSeen,
    sound: state.sound,
    setSound: (on) => setState((st) => ({ ...st, sound: on })),
  }), [ready, state, toggleFavorite, toggleFollow, markViewed, markSeen]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePrefs() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePrefs outside PrefsProvider");
  return c;
}
