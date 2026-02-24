import ShowVideoList from "../components/showVideos/showVideoList";
import { useAuth } from "../hooks/auth/useAuth";

function Overview() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center pt-10 pb-20 gap-8 w-full">
      <div className="w-full max-w-7xl px-4 lg:px-8">
        
        {/* Toggle Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 border-b border-border/50 pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Übersicht
          </h1>
        </div>

        {/* Content */}
        {user ? (
          <ShowVideoList videoType="licensed" userId={user.id} />
        ) : (
          <ShowVideoList videoType="licensed" userId={undefined} />
        )}
      </div>
    </div>
  );
}

export default Overview;
