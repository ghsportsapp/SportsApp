// Video performance utilities for efficient autoplay management

interface VideoManager {
  activeVideos: Set<HTMLVideoElement>;
  observers: Map<HTMLVideoElement, IntersectionObserver>;
}

// Global video manager to ensure only one video plays at a time
const videoManager: VideoManager = {
  activeVideos: new Set(),
  observers: new Map(),
};

export function pauseAllVideos(except?: HTMLVideoElement) {
  videoManager.activeVideos.forEach(video => {
    if (video !== except && !video.paused) {
      video.pause();
    }
  });
}

export function registerVideo(video: HTMLVideoElement, observer: IntersectionObserver) {
  videoManager.activeVideos.add(video);
  videoManager.observers.set(video, observer);
}

export function unregisterVideo(video: HTMLVideoElement) {
  videoManager.activeVideos.delete(video);
  const observer = videoManager.observers.get(video);
  if (observer) {
    observer.unobserve(video);
    observer.disconnect();
    videoManager.observers.delete(video);
  }
}

export function createOptimizedVideoObserver(
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
): IntersectionObserver {
  // Optimized observer with performance considerations
  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '0px',
    threshold: 0.5,
    ...options,
  });
}

// Enhanced video autoplay with single-video-at-a-time guarantee
export function handleVideoIntersection(
  entries: IntersectionObserverEntry[],
  onPlay?: () => void,
  onPause?: () => void
) {
  entries.forEach((entry) => {
    const video = entry.target as HTMLVideoElement;
    
    if (entry.isIntersecting) {
      // Pause all other videos first
      pauseAllVideos(video);
      
      // Then try to play this video
      if (video.paused) {
        video.play().then(() => {
          onPlay?.();
        }).catch((error) => {
          console.debug('Video autoplay blocked:', error);
        });
      }
    } else {
      // Video is out of viewport - pause
      if (!video.paused) {
        video.pause();
        onPause?.();
      }
    }
  });
}

// Memory cleanup utility
export function cleanupVideoResources() {
  videoManager.observers.forEach((observer, video) => {
    observer.unobserve(video);
    observer.disconnect();
  });
  videoManager.activeVideos.clear();
  videoManager.observers.clear();
}