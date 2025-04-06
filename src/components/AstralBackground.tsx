import { useEffect, useRef, useState } from 'react';

export function AstralBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const attemptedPlayRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Make sure we only try to play once
    const playOnce = async () => {
      if (attemptedPlayRef.current) return;
      
      attemptedPlayRef.current = true;
      try {
        await video.play();
        setIsPlaying(true);
        console.log("Background video started successfully");
      } catch (err) {
        console.warn("Autoplay prevented:", err);
        // Don't set attempted to false here as it might create loops
      }
    };

    // Set up event listeners
    const handleCanPlay = () => {
      if (!isPlaying && !attemptedPlayRef.current) {
        playOnce();
      }
    };

    // Only add event listener if video isn't already playing
    if (!isPlaying) {
      video.addEventListener('canplay', handleCanPlay);
      
      // If video is already loaded, try to play
      if (video.readyState >= 3) {
        playOnce();
      }
    }

    // Cleanup
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [isPlaying]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[-1]">
      <video 
        ref={videoRef}
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover"
        style={{ opacity: 0.7 }}
      >
        <source src="https://i.imgur.com/As7Fy43.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px]"></div>
    </div>
  );
}