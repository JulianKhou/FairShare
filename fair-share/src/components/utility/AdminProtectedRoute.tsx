import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { useEffect, useState } from "react";
import { getProfile } from "@/services/supabaseCollum/profiles";
import { Loader2 } from "lucide-react";

export const AdminProtectedRoute = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsAdmin(false);
      setChecking(false);
      return;
    }

    const checkAdmin = async () => {
      try {
        const profile = await getProfile(user.id);
        setIsAdmin(profile?.is_admin === true);
      } catch (err) {
        console.error("Failed to check admin status", err);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };

    checkAdmin();
  }, [user, authLoading]);

  if (authLoading || checking) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Redirect to landing page if not authenticated or not an admin
  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Render the child routes
  return <Outlet />;
};
