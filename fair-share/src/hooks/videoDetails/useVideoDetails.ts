import { licenseVideo } from "../../services/supabase/database";
import { useState, useEffect } from "react";
import { getVideoFromSupabaseById } from "../../services/supabase/database";
// Wir definieren einen Typ für bessere Sicherheit (wie wir besprochen haben : )
interface Video {
  id: string;
  islicensed: boolean;
  [key: string]: any;
}

export const useVideoDetails = (video: Video) => {
  const [isLicensed, setIsLicensed] = useState(video.islicensed);
  const [isLoading, setIsLoading] = useState(false);

  // Synchronisiere State, falls das Video-Objekt von außen aktualisiert wird
  // Lade aktuellen Status sicherheitshalber neu aus der DB
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getVideoFromSupabaseById(video.id);
        // Da getVideoFromSupabase ein Array zurückgibt:
        if (data && data.length > 0) {
          setIsLicensed(data[0].islicensed);
        }
      } catch (error) {
        console.error("Fehler beim Laden des Status:", error);
      }
    };
    fetchStatus();
  }, [video.id]);

  const toggleLicense = async () => {
    const newValue = !isLicensed;
    // 1. Optimistisches Update (UI reagiert sofort)
    setIsLicensed(newValue);
    setIsLoading(true);

    try {
      // 2. Datenbank-Update via Supabase (angenommen licenseVideo nutzt .update())
      await licenseVideo(video.id, newValue);
      // Hier würde deine Supabase-Logik greifen
    } catch (error) {
      // 3. Rollback bei Fehler: Wenn DB fehlschlägt, Wert zurücksetzen
      console.error("Lizenz-Update fehlgeschlagen:", error);
      setIsLicensed(!newValue);
      alert("Fehler beim Speichern der Lizenz-Änderung.");
    } finally {
      setIsLoading(false);
    }
  };

  return { isLicensed, toggleLicense, isLoading };
};
