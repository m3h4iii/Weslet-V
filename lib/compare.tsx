import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// The buyer's comparison list: up to 3 pieces, kept on the device.

export const MAX_COMPARE = 3;
const KEY = "weslet.compare.v1";

type CompareCtx = {
  ids: string[];
  has: (id: string) => boolean;
  /** adds or removes; returns "added" | "removed" | "full" */
  toggle: (id: string) => "added" | "removed" | "full";
  remove: (id: string) => void;
  clear: () => void;
};

const Ctx = createContext<CompareCtx | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((s) => { if (s) { const v = JSON.parse(s); if (Array.isArray(v)) setIds(v.slice(0, MAX_COMPARE)); } })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(ids)).catch(() => {});
  }, [ids, ready]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    if (ids.includes(id)) { setIds(ids.filter((x) => x !== id)); return "removed" as const; }
    if (ids.length >= MAX_COMPARE) return "full" as const;
    setIds([...ids, id]);
    return "added" as const;
  }, [ids]);

  const remove = useCallback((id: string) => setIds((cur) => cur.filter((x) => x !== id)), []);
  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(() => ({ ids, has, toggle, remove, clear }), [ids, has, toggle, remove, clear]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompare() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCompare outside CompareProvider");
  return c;
}
