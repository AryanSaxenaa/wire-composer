"use client";

import { createContext, useContext, useRef, useCallback, useMemo, ReactNode } from "react";

interface CredentialsContextValue {
  getAllCredentials: () => Record<string, Record<string, string>>;
  setNodeCredentials: (nodeId: string, creds: Record<string, string>) => void;
}

const CredentialsContext = createContext<CredentialsContextValue | null>(null);

export function CredentialsProvider({ children }: { children: ReactNode }) {
  const credsRef = useRef<Record<string, Record<string, string>>>({});

  const getAllCredentials = useCallback(() => {
    return { ...credsRef.current };
  }, []);

  const setNodeCredentials = useCallback(
    (nodeId: string, creds: Record<string, string>) => {
      credsRef.current = { ...credsRef.current, [nodeId]: creds };
    },
    []
  );

  const value = useMemo(
    () => ({ getAllCredentials, setNodeCredentials }),
    [getAllCredentials, setNodeCredentials]
  );

  return (
    <CredentialsContext.Provider value={value}>
      {children}
    </CredentialsContext.Provider>
  );
}

export function useCredentials() {
  const ctx = useContext(CredentialsContext);
  if (!ctx) throw new Error("useCredentials must be used within CredentialsProvider");
  return ctx;
}
