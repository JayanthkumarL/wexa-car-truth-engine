/**
 * components/BackgroundVideo.jsx
 *
 * Global background video component.
 *
 * Responsibilities:
 *   - Plays Video Project 1.mp4 in a seamless, muted, infinite loop.
 *   - Positioned as a fixed full-screen layer across all routes.
 *   - Fully responsive across all device breakpoints (object-cover).
 *   - Includes an overlay gradient for text legibility and high contrast.
 */

import { useEffect, useRef } from 'react';
import bgVideo from '../BgVideo/Video Project 1.mp4';

export default function BackgroundVideo() {
  const videoRef = useRef(null);

  useEffect(() => {
    // Programmatic play trigger to ensure browser autoplay policies pass
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.warn('Background video autoplay prevented:', err);
      });
    }
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover min-w-full min-h-full scale-105"
      >
        <source src={bgVideo} type="video/mp4" />
      </video>
      {/* Universal dark gradient overlay ensuring readability across all pages */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-950/60 to-slate-950/85 backdrop-blur-[1px]" />
    </div>
  );
}
