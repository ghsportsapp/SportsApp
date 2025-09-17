import { useRef, useEffect, useCallback } from 'react';
import { 
  registerVideo, 
  unregisterVideo, 
  createOptimizedVideoObserver,
  handleVideoIntersection 
} from '@/utils/video-performance';

interface UseVideoAutoplayOptions {
  rootMargin?: string;
  threshold?: number;
  onPlay?: () => void;
  onPause?: () => void;
}

export function useVideoAutoplay({
  rootMargin = '0px',
  threshold = 0.5,
  onPlay,
  onPause,
}: UseVideoAutoplayOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    handleVideoIntersection(entries, onPlay, onPause);
  }, [onPlay, onPause]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Check if IntersectionObserver is supported
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback: keep video paused if no IntersectionObserver support
      video.autoplay = false;
      video.muted = true;
      return;
    }

    // Ensure video starts paused and muted
    video.autoplay = false;
    video.muted = true; // Required for autoplay in most browsers
    
    // Create optimized observer
    observerRef.current = createOptimizedVideoObserver(handleIntersection, {
      rootMargin,
      threshold,
    });

    // Register video and start observing
    registerVideo(video, observerRef.current);
    observerRef.current.observe(video);

    return () => {
      if (video) {
        unregisterVideo(video);
      }
    };
  }, [handleIntersection, rootMargin, threshold]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const video = videoRef.current;
      if (video) {
        unregisterVideo(video);
      }
    };
  }, []);

  return videoRef;
}