import { PlayCircle } from "lucide-react";

/**
 * Turns a normal YouTube watch/share URL into an embeddable URL.
 * Falls back to returning the original URL for other hosts (e.g. Vimeo,
 * direct .mp4 links, S3/Cloudinary links) so <video> or <iframe> can
 * still render whatever was stored.
 */
function toEmbedUrl(url: string): { type: "youtube" | "video" | "iframe"; src: string } {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId = parsed.searchParams.get("v");
      if (videoId) {
        return { type: "youtube", src: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` };
      }
    }
    if (host === "youtu.be") {
      const videoId = parsed.pathname.replace("/", "");
      if (videoId) {
        return { type: "youtube", src: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0` };
      }
    }
    if (/\.(mp4|webm|ogg)$/i.test(parsed.pathname)) {
      return { type: "video", src: url };
    }
    return { type: "iframe", src: url };
  } catch {
    return { type: "iframe", src: url };
  }
}

export function VideoPlayer({ url, title }: { url?: string; title: string }) {
  if (!url) {
    return (
      <div className="aspect-video w-full rounded-xl bg-surface-container-highest flex flex-col items-center justify-center text-on-surface-variant gap-2">
        <PlayCircle className="w-10 h-10" />
        <p className="text-sm">No video attached to this lesson yet.</p>
      </div>
    );
  }

  const embed = toEmbedUrl(url);

  return (
    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
      {embed.type === "video" ? (
        <video key={embed.src} src={embed.src} controls autoPlay className="w-full h-full" title={title} />
      ) : (
        <iframe
          key={embed.src}
          src={embed.src}
          title={title}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}
    </div>
  );
}
