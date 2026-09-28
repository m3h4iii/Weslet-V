import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView, type VideoPlayer } from "expo-video";
import { colors } from "@/lib/theme";

type Props = {
  uri: string;
  poster?: string | null;
  active: boolean;   // play only when on screen
  muted: boolean;
  width: number;
  height: number;
};

/**
 * A reel-style video that never "zooms": phone-shaped clips (≈9:16) fill the box,
 * anything else (square, 4:5, landscape) is shown whole over a blurred backdrop.
 */
export function SmartVideo({ uri, poster, active, muted, width, height }: Props) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });
  const aspect = useVideoAspect(player);

  // Autoplay rules (iOS Safari especially): a video only starts on its own when
  // it is muted. So: start muted, then unmute once it is really playing if the
  // buyer wants sound. If the browser refuses, fall back to muted playback.
  useEffect(() => {
    if (!active) { player.pause(); player.muted = true; return; }
    let cancelled = false;
    const el = () => { const v: Set<HTMLVideoElement> | undefined = (player as any)._mountedVideos; return v ? [...v][0] : undefined; };

    const start = () => {
      if (cancelled) return;
      player.muted = true;
      const e = el();
      if (e) {
        e.muted = true;
        e.play().catch(() => {});
      } else {
        player.play();
      }
      if (!muted) {
        // give it a moment to be actually playing, then try with sound
        setTimeout(() => {
          if (cancelled) return;
          const v = el();
          player.muted = false;
          if (v) {
            v.muted = false;
            if (v.paused) v.play().catch(() => { v.muted = true; player.muted = true; v.play().catch(() => {}); });
          }
        }, 350);
      }
    };

    start();
    // Not ready yet (source still loading)? Play as soon as it is.
    const sub = player.addListener("statusChange", (e) => { if (e.status === "readyToPlay") start(); });
    const t = setTimeout(start, 600); // late element mount on web
    return () => { cancelled = true; clearTimeout(t); sub.remove(); };
  }, [active, muted, player]);

  const box = width / height;
  // Unknown size yet → assume phone-shaped (most uploads). Within ~20% of the box → fill (9:16 on any phone).
  const fill = aspect == null || Math.abs(aspect - box) / box < 0.22;

  return (
    <View style={{ width, height, backgroundColor: colors.ink, overflow: "hidden" }}>
      {poster ? (
        <Image
          source={{ uri: poster }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          blurRadius={fill ? 0 : 24}
        />
      ) : null}
      {!fill ? <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.35)" }]} /> : null}
      <VideoView
        player={player}
        // explicit size: on web the <video> otherwise renders at its natural pixel size, top-left
        style={{ position: "absolute", top: 0, left: 0, width, height }}
        contentFit={fill ? "cover" : "contain"}
        nativeControls={false}
        playsInline
        allowsPictureInPicture={false}
        fullscreenOptions={{ enable: false }}
      />
    </View>
  );
}

/** width / height of the loaded video, or null until known. */
function useVideoAspect(player: VideoPlayer): number | null {
  const [aspect, setAspect] = useState<number | null>(null);

  useEffect(() => {
    let stopped = false;
    const setFromSize = (w?: number, h?: number) => {
      if (!stopped && w && h) setAspect(w / h);
    };

    // Native: the player knows its video track.
    const fromTrack = () => setFromSize(player.videoTrack?.size?.width, player.videoTrack?.size?.height);
    fromTrack();
    const subs = [
      player.addListener("videoTrackChange", (e) => setFromSize(e.videoTrack?.size?.width, e.videoTrack?.size?.height)),
      player.addListener("sourceLoad", (e) => {
        const t = e.availableVideoTracks?.[0];
        setFromSize(t?.size?.width, t?.size?.height);
        readWebElement();
      }),
      player.addListener("statusChange", () => { fromTrack(); readWebElement(); }),
    ];

    // Web: read the <video> element the player is mounted on.
    function readWebElement() {
      const videos: Set<HTMLVideoElement> | undefined = (player as any)._mountedVideos;
      const el = videos ? [...videos][0] : undefined;
      if (!el) return;
      if (el.videoWidth && el.videoHeight) setFromSize(el.videoWidth, el.videoHeight);
      else el.addEventListener("loadedmetadata", () => setFromSize(el.videoWidth, el.videoHeight), { once: true });
    }
    const t = setTimeout(readWebElement, 50);

    return () => {
      stopped = true;
      clearTimeout(t);
      subs.forEach((s) => s.remove());
    };
  }, [player]);

  return aspect;
}
