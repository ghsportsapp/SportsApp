import { useState, useRef, useEffect, useCallback } from 'react';

interface ProgressiveLazyImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean; // For above-the-fold images
}

export function ProgressiveLazyImage({
  src,
  alt,
  className = '',
  sizes = '100vw',
  width,
  height,
  placeholder,
  quality = 80,
  onLoad,
  onError,
  priority = false,
}: ProgressiveLazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Load immediately if priority
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  // Generate progressive image sources
  const generateProgressiveSrcs = useCallback(() => {
    if (!src) return { lowQuality: '', highQuality: src };
    
    // Create low quality version (10% quality, smaller size)
    const lowQualitySrc = src.includes('?') 
      ? `${src}&q=10&w=${Math.floor((width || 400) * 0.5)}`
      : `${src}?q=10&w=${Math.floor((width || 400) * 0.5)}`;
    
    // Create high quality version
    const highQualitySrc = src.includes('?')
      ? `${src}&q=${quality}${width ? `&w=${width}` : ''}${height ? `&h=${height}` : ''}`
      : `${src}?q=${quality}${width ? `&w=${width}` : ''}${height ? `&h=${height}` : ''}`;
    
    return { lowQuality: lowQualitySrc, highQuality: highQualitySrc };
  }, [src, width, height, quality]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return; // Skip if priority or already in view
    
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(img);
        }
      },
      {
        root: null,
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.1,
      }
    );

    observer.observe(img);

    return () => {
      observer.unobserve(img);
    };
  }, [priority, isInView]);

  // Progressive loading effect
  useEffect(() => {
    if (!isInView) return;

    const { lowQuality, highQuality } = generateProgressiveSrcs();
    
    // Load low quality first for instant feedback
    if (lowQuality && !priority) {
      setCurrentSrc(lowQuality);
      
      // Then load high quality in background
      const highQualityImg = new Image();
      highQualityImg.onload = () => {
        setCurrentSrc(highQuality);
        setIsLoaded(true);
        onLoad?.();
      };
      highQualityImg.onerror = () => {
        setHasError(true);
        onError?.();
      };
      highQualityImg.src = highQuality;
    } else {
      // For priority images, load high quality immediately
      setCurrentSrc(highQuality);
    }
  }, [isInView, generateProgressiveSrcs, priority, onLoad, onError]);

  const handleLoad = useCallback(() => {
    if (priority) {
      setIsLoaded(true);
      onLoad?.();
    }
  }, [priority, onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    setCurrentSrc(placeholder || generatePlaceholder());
    onError?.();
  }, [placeholder, onError]);

  // Generate SVG placeholder
  const generatePlaceholder = useCallback(() => {
    const w = width || 400;
    const h = height || 300;
    return `data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22${w}%22%20height%3D%22${h}%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23f0f0f0%22/%3E%3C/svg%3E`;
  }, [width, height]);

  const displaySrc = currentSrc || placeholder || generatePlaceholder();

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Main image */}
      <img
        ref={imgRef}
        src={displaySrc}
        alt={alt}
        sizes={sizes}
        className={`
          w-full h-full object-cover transition-all duration-500
          ${isLoaded ? 'opacity-100 scale-100' : 'opacity-70 scale-105'}
          ${hasError ? 'opacity-50 grayscale' : ''}
          ${!isInView && !priority ? 'blur-sm' : ''}
        `}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Loading indicator */}
      {!isLoaded && !hasError && isInView && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">Image failed to load</span>
          </div>
        </div>
      )}

      {/* Progressive loading effect overlay */}
      {isInView && !isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 -skew-x-12 animate-pulse" />
      )}
    </div>
  );
}