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

  useEffect(() => {
    if (active) player.play(); else player.pause();
  }, [active, player]);
  useEffect(() => {
    // only the visible video is ever unmuted
    player.muted = muted || !active;
  }, [muted, active, player]);

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
