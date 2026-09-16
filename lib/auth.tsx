import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { IS_MOCK } from "./data";
import type { Profile } from "./types";

type AuthCtx = {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  /** true when a customer is signed in (always true in mock mode so the flow can be tested) */
  signedIn: boolean;
  sendCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  updateProfile: (p: { fullName: string; phone: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

const MOCK_PROFILE: Profile = { id: "mock-user", email: "demo@weslet.tn", fullName: "Client démo", phone: "" };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(IS_MOCK);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(IS_MOCK ? MOCK_PROFILE : null);

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!s) return setProfile(null);
    const { data } = await supabase.from("profiles").select("id, full_name, phone").eq("id", s.user.id).maybeSingle();
    setProfile({
      id: s.user.id,
      email: s.user.email ?? null,
      fullName: data?.full_name ?? (s.user.user_metadata?.full_name as string | undefined) ?? "",
      phone: data?.phone ?? "",
    });
  }, []);

  useEffect(() => {
    if (IS_MOCK) return;
    supabase.auth.getSession()
      .then(({ data }) => { setSession(data.session); return loadProfile(data.session); })
      .finally(() => setReady(true));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); loadProfile(s); });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value = useMemo<AuthCtx>(() => ({
    ready,
    session,
    profile,
    signedIn: IS_MOCK || !!session,
    sendCode: async (email) => {
      if (IS_MOCK) return;
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { shouldCreateUser: true } });
      if (error) throw new Error(error.message);
    },
    verifyCode: async (email, code) => {
      if (IS_MOCK) return;
      const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "email" });
      if (error) throw new Error(/expired|invalid/i.test(error.message) ? "Code invalide ou expiré." : error.message);
    },
    updateProfile: async ({ fullName, phone }) => {
      if (IS_MOCK) { setProfile((p) => (p ? { ...p, fullName, phone } : p)); return; }
      if (!session) throw new Error("Connexion requise");
      const { error } = await supabase.from("profiles").update({ full_name: fullName.trim(), phone: phone.trim() }).eq("id", session.user.id);
      if (error) throw new Error(error.message);
      setProfile((p) => (p ? { ...p, fullName: fullName.trim(), phone: phone.trim() } : p));
    },
    signOut: async () => {
      if (IS_MOCK) return;
      await supabase.auth.signOut();
    },
  }), [ready, session, profile]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth outside AuthProvider");
  return c;
}
