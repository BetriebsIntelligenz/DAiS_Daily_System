"use client";

import { useEffect, useRef, useState } from "react";

const CROSSFADE_BUFFER_SECONDS = 0.8;
const CROSSFADE_DELAY_MS = 850;
const BACKGROUND_VIDEO_SRC = "/DAiS_Video_BG.mp4";

export const BackgroundVideo = () => {
  const primaryVideoRef = useRef<HTMLVideoElement>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement>(null);
  const videoRefs = [primaryVideoRef, secondaryVideoRef] as const;
  const [activeIndex, setActiveIndex] = useState<0 | 1>(0);
  const activeIndexRef = useRef<0 | 1>(0);
  const crossfadeInProgressRef = useRef(false);
  const fadeTimeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const primaryVideo = primaryVideoRef.current;
    if (!primaryVideo) {
      return;
    }

    const tryPlay = () => {
      primaryVideo.play().catch(() => {
        /* Autoplay might be blocked; ignorable for muted background */
      });
    };

    primaryVideo.addEventListener("canplay", tryPlay);
    tryPlay();

    return () => {
      primaryVideo.removeEventListener("canplay", tryPlay);
    };
  }, [primaryVideoRef]);

  useEffect(() => {
    const listeners = [primaryVideoRef, secondaryVideoRef].map((ref, index) => {
      const video = ref.current;
      if (!video) {
        return null;
      }

      const handleTimeUpdate = () => {
        if (index !== activeIndexRef.current) {
          return;
        }

        if (!video.duration || crossfadeInProgressRef.current) {
          return;
        }

        const timeLeft = video.duration - video.currentTime;
        if (timeLeft > CROSSFADE_BUFFER_SECONDS) {
          return;
        }

        const nextIndex = (index === 0 ? 1 : 0) as 0 | 1;
        const nextVideo = videoRefs[nextIndex].current;
        if (!nextVideo) {
          return;
        }

        crossfadeInProgressRef.current = true;
        nextVideo.currentTime = 0;
        nextVideo
          .play()
          .then(() => {
            setActiveIndex(nextIndex);
            if (fadeTimeoutRef.current) {
              window.clearTimeout(fadeTimeoutRef.current);
            }
            fadeTimeoutRef.current = window.setTimeout(() => {
              video.pause();
              crossfadeInProgressRef.current = false;
            }, CROSSFADE_DELAY_MS);
          })
          .catch(() => {
            crossfadeInProgressRef.current = false;
          });
      };

      video.addEventListener("timeupdate", handleTimeUpdate);
      return { video, handleTimeUpdate };
    });

    return () => {
      listeners.forEach((entry) => {
        if (!entry) {
          return;
        }
        entry.video.removeEventListener("timeupdate", entry.handleTimeUpdate);
      });
      if (fadeTimeoutRef.current) {
        window.clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [primaryVideoRef, secondaryVideoRef]);

  return (
    <div className="background-video" aria-hidden="true">
      {[0, 1].map((index) => (
        <video
          key={index}
          ref={videoRefs[index]}
          className={`background-video__media${activeIndex === index ? " background-video__media--active" : ""
            }`}
          autoPlay={index === 0}
          muted
          loop
          playsInline
          preload="auto"
          poster={index === 0 ? "/Only_BG_Dais.jpg" : undefined}
        >
          <source src={BACKGROUND_VIDEO_SRC} type="video/mp4" />
        </video>
      ))}
    </div>
  );
};
