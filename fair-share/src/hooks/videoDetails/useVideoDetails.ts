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
  // Debug log to see what we get from the parent
  console.log(
    "useVideoDetails init:",
    video.id,
    "islicensed prop:",
    video.islicensed,
    "full object:",
    video,
  );

  const [isLicensed, setIsLicensed] = useState(video.islicensed);
  const [isLoading, setIsLoading] = useState(false);

  // Synchronisiere State, falls das Video-Objekt von außen aktualisiert wird
  // Lade aktuellen Status sicherheitshalber neu aus der DB
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        console.log("Fetching fresh status for:", video.id);
        const data = await getVideoFromSupabaseById(video.id);
        console.log("Fetched data:", data);

        // Da getVideoFromSupabase ein Array zurückgibt:
        if (data && data.length > 0) {
          const freshStatus = data[0].islicensed;
          console.log("Setting isLicensed to:", freshStatus);
          setIsLicensed(freshStatus);
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
      console.log("Lizenz-Update erfolgreich");
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
