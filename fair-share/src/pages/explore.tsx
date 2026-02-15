// src/pages/explore.tsx
import React, { useEffect, useRef } from "react";
import ShowVideoList from "../components/showVideos/showVideoList";
import { useAuth } from "../hooks/auth/useAuth";
import { useSearchParams } from "react-router-dom";
import { deleteReactionContract } from "../services/supabaseCollum/reactionContract";

function Explore() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const alertShown = useRef(false);

  useEffect(() => {
    const success = searchParams.get("success");
    const canceled = searchParams.get("canceled");
    const contractId = searchParams.get("contractId");

    // Prevent double invocation in StrictMode
    if (alertShown.current) return;

    if (success) {
      alertShown.current = true;
      // Delay alert to allow UI to render first
      setTimeout(() => {
        alert("Payment successful! Your license has been created.");
      }, 500);
      setSearchParams({}, { replace: true });
    }

    if (canceled) {
      alertShown.current = true;
      if (contractId) {
        deleteReactionContract(contractId)
          .then(() => {
            setTimeout(() => {
              alert("Payment canceled. The pending contract has been deleted.");
            }, 100);
          })
          .catch((err) => {
            console.error("Failed to delete contract:", err);
            setTimeout(() => {
              alert("Payment canceled. Could not delete pending contract.");
            }, 100);
          });
      } else {
        setTimeout(() => {
          alert("Payment canceled.");
        }, 100);
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="flex flex-col items-center justify-center pt-20 overflow-hidden gap-8 w-full">
      <div className="w-full max-w-6xl px-4">
        <h1 className="text-2xl font-bold mb-4">My Licensed Videos</h1>
        {/* Zeige nur lizenzierte Videos des aktuellen Users, oder Login-Hinweis */}
        {user ? (
          <ShowVideoList videoType="licensedByMe" userId={user.id} />
        ) : (
          <div className="p-8 text-center border border-dashed rounded-lg bg-muted/30">
            <p className="text-muted-foreground">
              Bitte melde dich an, um deine lizenzierten Videos zu sehen.
            </p>
          </div>
        )}
      </div>

      <div className="w-full max-w-6xl px-4">
        <h1 className="text-2xl font-bold mb-4">Explore</h1>
        {/* Zeige alle Videos (oder zumindest eine öffentliche Auswahl) */}
        <ShowVideoList videoType="licensed" userId={user?.id} />
      </div>
    </div>
  );
}

export default Explore;
