import React from "react";
import ShowVideoList from "../components/showVideos/showVideoList";
import LoadVideosButton from "../components/showVideos/loadVideosButton";
import { useAuth } from "../hooks/auth/useAuth";
function MyVideos() {
  const { user } = useAuth();
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center relative top-23 gap-4">
        Please log in to view your videos.
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center relative top-23 gap-4">
      <LoadVideosButton />
      <ShowVideoList videoType="myVideos" userId={user.id} />
    </div>
  );
}
export default MyVideos;
