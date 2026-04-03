import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { User } from "../lib/types";
import * as auth from "../lib/auth";

type AuthContextValue = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (input: {
    email: string;
    password: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  signup: (input: {
    name: string;
    email: string;
    password: string;
    location: string;
    adminKey?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchInProgressRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Skip if already fetching (React Strict Mode double-invocation)
    if (fetchInProgressRef.current) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let retries = 0;
    const maxRetries = 2;

    const fetchUser = async () => {
      if (!isMountedRef.current) return;
      fetchInProgressRef.current = true;

      try {
        const current = await auth.getCurrentUser();
        if (isMountedRef.current) {
          setUser(current);
          fetchInProgressRef.current = false;
        }
      } catch (error: any) {
        // Retry on lock errors
        if (
          isMountedRef.current &&
          retries < maxRetries &&
          (error?.message?.includes("Lock") ||
            error?.message?.includes("steal"))
        ) {
          retries++;
          fetchInProgressRef.current = false;
          timeoutId = setTimeout(fetchUser, 100 * retries);
          return;
        }
        if (isMountedRef.current) {
          console.error("Failed to fetch user:", error);
          setUser(null);
          fetchInProgressRef.current = false;
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isAdmin: auth.isAdmin(user),
      loading,
      login: async (input) => {
        const result = await auth.login(input);
        if (result.user) {
          setUser(result.user);
          return { ok: true };
        }
        return { ok: false, error: result.error };
      },
      signup: async (input) => {
        const result = await auth.signUp(input);
        if (result.user) {
          setUser(result.user);
          return { ok: true };
        }
        return { ok: false, error: result.error };
      },
      logout: async () => {
        await auth.logout();
        setUser(null);
      },
      refresh: async () => {
        const current = await auth.getCurrentUser();
        setUser(current);
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
