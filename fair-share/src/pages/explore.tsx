// src/pages/explore.tsx
import React from "react";
import ShowVideoList from "../components/showVideos/showVideoList";
import { useAuth } from "../hooks/auth/useAuth";

function Explore() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center pt-20 overflow-hidden gap-8 w-full">
      <div className="w-full max-w-6xl px-4">
        <h1 className="text-2xl font-bold mb-4">My Licensed Videos</h1>
        {/* Zeige nur lizenzierte Videos des aktuellen Users */}
        <ShowVideoList videoType="licensedByMe" userId={user?.id} />
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
