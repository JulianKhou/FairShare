// src/hooks/debug/useVideoSimulation.ts
import { useState, useMemo, useEffect } from "react";

export const useVideoSimulation = (initialVideo: any) => {
    // 1. Lokaler State für die Views
    const [mockViews, setMockViews] = useState<number>(initialVideo?.last_view_count || 0);

    // Resetten, wenn sich das Video ändert (z.B. neues Suchergebnis)
    useEffect(() => {
        if (initialVideo) {
            setMockViews(initialVideo.last_view_count || 0);
        }
    }, [initialVideo?.id]);

    // 2. Wir erstellen ein "simuliertes" Video-Objekt
    // useMemo sorgt dafür, dass das Objekt nur neu erstellt wird, wenn mockViews sich ändert
    const simulatedVideo = useMemo(() => {
        if (!initialVideo) return null;
        return {
            ...initialVideo,       // Kopiere alle alten Eigenschaften
            last_view_count: mockViews, // Überschreibe nur die Views für Anzeige
            views: mockViews,      // Überschreibe views für Preisberechnung (wichtig!)
        };
    }, [initialVideo, mockViews]);

    const handleViewsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMockViews(Number(e.target.value));
    };

    return {
        simulatedVideo, // Dieses Objekt nutzt du für dein UI/Algorithmus
        mockViews,
        setMockViews,
        handleViewsChange
    };
};