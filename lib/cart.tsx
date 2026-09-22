import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { unitsLeft } from "./data";
import type { CartLine, Product } from "./types";

type CartCtx = {
  lines: CartLine[];
  count: number;
  total: number;
  add: (product: Product, variant?: string | null) => void;
  setQty: (productId: string, variant: string | null, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "weslet.cart.v2";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((s) => s && setLines(JSON.parse(s)))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(lines)).catch(() => {});
  }, [lines, ready]);

  const value = useMemo<CartCtx>(() => {
    const same = (l: CartLine, id: string, v: string | null) => l.product.id === id && l.variant === v;
    return {
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      total: lines.reduce((n, l) => n + l.qty * l.product.price, 0),
      add: (product, variant = null) =>
        setLines((prev) => {
          const i = prev.findIndex((l) => same(l, product.id, variant));
          if (i === -1) return [...prev, { product, variant, qty: 1 }];
          const next = [...prev];
          next[i] = { ...next[i], qty: Math.min(next[i].qty + 1, Math.max(1, unitsLeft(product, variant))) };
          return next;
        }),
      setQty: (id, variant, qty) =>
        setLines((prev) =>
          qty <= 0
            ? prev.filter((l) => !same(l, id, variant))
            : prev.map((l) => (same(l, id, variant) ? { ...l, qty: Math.min(qty, Math.max(1, unitsLeft(l.product, variant))) } : l)),
        ),
      clear: () => setLines([]),
    };
  }, [lines]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
