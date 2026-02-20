import React, { useState, useCallback } from "react";
import {
    createReactionContract,
    getReactionContracts,
    getReactionContractById,
    updateReactionContract,
    deleteReactionContract,
    ReactionContract,
} from "../services/supabaseCollum/reactionContract";

export const useReactionContracts = (videoCreator: any, videoReactor: any) => {
    const [contracts, setContracts] = useState<ReactionContract[]>([]);
    const [currentContract, setCurrentContract] = useState<ReactionContract | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<any>(null);
    const isMounted = React.useRef(true);

    React.useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const fetchContracts = useCallback(async () => {
        if (!isMounted.current) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await getReactionContracts();
            if (isMounted.current && data) setContracts(data as ReactionContract[]);
        } catch (err) {
            if (isMounted.current) setError(err);
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    }, []);

    const fetchContractById = useCallback(async (id: string) => {
        if (!isMounted.current) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await getReactionContractById(id);
            if (isMounted.current && data && data.length > 0) setCurrentContract(data[0] as ReactionContract);
        } catch (err) {
            if (isMounted.current) setError(err);
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    }, []);

    const createContract = async (contract: ReactionContract) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await createReactionContract(contract);
            // Optional: Refresh list or add to local state
            await fetchContracts();
            return data;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const updateContract = async (id: string, updates: Partial<ReactionContract>) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await updateReactionContract(id, updates);
            await fetchContracts();
            return data;
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const deleteContract = async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            await deleteReactionContract(id);
            await fetchContracts();
        } catch (err) {
            setError(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        contracts,
        currentContract,
        isLoading,
        error,
        fetchContracts,
        fetchContractById,
        createContract,
        updateContract,
        deleteContract
    };
};
