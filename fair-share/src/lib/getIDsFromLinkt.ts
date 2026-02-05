interface GetIDsFromLinkProps {
  videoUrl: string;
}
export const getIDsFromLink = ({ videoUrl }: GetIDsFromLinkProps) => {
  let videoId = "";
  try {
    const urlObj = new URL(videoUrl);
    if (urlObj.hostname.includes("youtube.com")) {
      videoId = urlObj.searchParams.get("v") || "";
    } else if (urlObj.hostname.includes("youtu.be")) {
      videoId = urlObj.pathname.slice(1);
    }
  } catch (e) {
    // Fallback or simple regex if URL parsing fails
    const match = videoUrl.match(/[?&]v=([^&]+)/);
    if (match) videoId = match[1];
    else if (videoUrl.includes("youtu.be/")) {
      videoId = videoUrl.split("youtu.be/")[1]?.split("?")[0] || "";
    }
  }

  // Basic cleanup just in case
  if (videoId.includes("&")) videoId = videoId.split("&")[0];

  // Channel ID extraction is unreliable from just a video link usually,
  // keeping it empty or trying a basic param extraction if present
  let channelId = "";
  if (videoUrl.includes("channel=") || videoUrl.includes("ab_channel=")) {
    // Very basic extraction attempt, often not present in standard watch URLs
    const match = videoUrl.match(/[?&](?:ab_)?channel=([^&]+)/);
    if (match) channelId = match[1];
  }

  return { videoId, channelId };
};
