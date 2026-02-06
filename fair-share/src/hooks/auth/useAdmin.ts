// hooks/useAdmin.ts
import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase/client';
import { useAuth } from './useAuth'; // Dein existierender Auth-Hook

export const useAdmin = () => {
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!user) {
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            // Wir fragen die profiles Tabelle nach dem Admin-Status ab
            const { data, error } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', user.id)
                .single();

            if (data && !error) {
                setIsAdmin(data.is_admin);
            }
            setLoading(false);
        };

        checkAdminStatus();
    }, [user]);

    // Wir erlauben Admin-Rechte, wenn isAdmin TRUE ist 
    // ODER wenn wir lokal entwickeln (import.meta.env.DEV)
    const hasAdminAccess = isAdmin || import.meta.env.DEV;

    return { isAdmin: hasAdminAccess, loading };
};