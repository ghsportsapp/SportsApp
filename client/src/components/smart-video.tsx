import { memo, forwardRef } from 'react';
import { useVideoAutoplay } from '@/hooks/use-video-autoplay';

interface SmartVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
  className?: string;
  autoplayThreshold?: number;
  rootMargin?: string;
  onAutoplay?: () => void;
  onAutopause?: () => void;
}

// Memoized smart video component for better performance
export const SmartVideo = memo(forwardRef<HTMLVideoElement, SmartVideoProps>(({
  src,
  className = '',
  autoplayThreshold = 0.5,
  rootMargin = '0px',
  onAutoplay,
  onAutopause,
  ...videoProps
}, externalRef) => {
  const autoplayRef = useVideoAutoplay({
    threshold: autoplayThreshold,
    rootMargin,
    onPlay: onAutoplay,
    onPause: onAutopause,
  });

  // Use external ref if provided, otherwise use autoplay ref
  const videoRef = externalRef || autoplayRef;

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      muted
      playsInline
      preload="metadata"
      {...videoProps}
    />
  );
}));

SmartVideo.displayName = 'SmartVideo';