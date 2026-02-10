import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../services/supabaseCollum/client";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // A. Den aktuellen Stand abfragen
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log(
        "useAuth: Initial session check:",
        session ? "Active" : "None",
        session?.user?.id,
      );
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // B. Auf Änderungen lauschen
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(
        "useAuth: Auth state changed:",
        event,
        session ? "Session Active" : "No Session",
      );
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);
  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(
      "useAuth muss innerhalb eines AuthProviders verwendet werden",
    );
  }
  return context;
};
