
import { Button } from "../ui/button";

export interface ChangeVideoSettingsProps {
    video: any; // Das simulierte Video-Objekt
    handleViewsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setMockViews: (views: number) => void;
}

export const ChangeVideoSettings = ({ video, handleViewsChange, setMockViews }: ChangeVideoSettingsProps) => {
    if (!video) return null;

    return (
        <div className="p-4 bg-gray-900 text-white rounded-lg border border-purple-500">
            <p className="text-purple-400 font-bold">🛠 Debug Mode</p>
            <p className="text-xs text-gray-400">Video ID: {video.id}</p>
            <p className="text-xs text-gray-400">Video Title: {video.title}</p>

            <div className="mt-4 flex flex-col gap-2">
                <label htmlFor="views" className="text-sm">Simulierte Views:</label>
                <input
                    type="number"
                    id="views"
                    placeholder="Enter Views"
                    // Hier liegt der Schlüssel:
                    value={video.last_view_count}
                    onChange={handleViewsChange} // Aktualisiert bei jedem Tastendruck
                    className="border border-gray-700 bg-gray-800 rounded-md p-2 text-white outline-none focus:border-teal-500"
                />
            </div>

            <div className="mt-4 flex gap-2">
                <p className="text-sm">Aktuelle Simulation: </p>
                <p className="text-teal-400 font-mono">
                    {video.last_view_count.toLocaleString()} Views
                </p>
            </div>

            {/* Optional: Ein Button zum schnellen Testen von hohen Zahlen */}
            <Button
                variant="outline"
                className="mt-2"
                onClick={() => setMockViews(1000000)}
            >
                Set 1 Mio Views
            </Button>
        </div>
    );
};