import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { queryClient } from "@/src/api/query-client";
import { sessionBridge } from "@/src/api/http-client";
import { authenticate } from "./api";
import { type SessionUser, userSchema } from "./types";

const TOKEN_KEY = "sat.session.token";
const USER_KEY = "sat.session.user";
type AuthValue = { user: SessionUser | null; ready: boolean; signIn(email: string, password: string): Promise<void>; signOut(): Promise<void> };
const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const signOut = useCallback(async () => {
    sessionBridge.setToken(null); setUser(null); queryClient.clear();
    await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(USER_KEY)]);
    router.replace("/(auth)/login");
  }, []);
  useEffect(() => { sessionBridge.onUnauthorized(signOut); void (async () => {
    const [token, storedUser] = await Promise.all([SecureStore.getItemAsync(TOKEN_KEY), SecureStore.getItemAsync(USER_KEY)]);
    if (token) { sessionBridge.setToken(token); if (storedUser) setUser(userSchema.parse(JSON.parse(storedUser))); }
    setReady(true);
  })(); }, [signOut]);
  const signIn = useCallback(async (email: string, password: string) => {
    const session = await authenticate(email, password);
    await SecureStore.setItemAsync(TOKEN_KEY, session.token, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user));
    sessionBridge.setToken(session.token); setUser(session.user); router.replace("/(app)/(tabs)/dashboard");
  }, []);
  const value = useMemo(() => ({ user, ready, signIn, signOut }), [ready, signIn, signOut, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be within AuthProvider"); return value; }
