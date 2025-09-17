import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Screenshot {
  id: number;
  image: string;
  alt: string;
}

// Import horizontal screenshots
import homeScreenshot from '@assets/Screenshot 2025-08-06 135606_1754469490478.png';
import drillsScreenshot from '@assets/Screenshot 2025-08-06 135650_1754469490479.png';
import newsScreenshot from '@assets/Screenshot 2025-08-06 140436_1754469490480.png';
import coachingScreenshot from '@assets/Screenshot 2025-08-06 140740_1754469490480.png';

const screenshots: Screenshot[] = [
  {
    id: 1,
    image: homeScreenshot,
    alt: 'SportsApp Home - Ultimate Sport Network'
  },
  {
    id: 2,
    image: drillsScreenshot,
    alt: 'Do Drills and Earn Points - Multi-Sport Training'
  },
  {
    id: 3,
    image: newsScreenshot,
    alt: 'Sports News - Global Coverage with Indian Sports Priority'
  },
  {
    id: 4,
    image: coachingScreenshot,
    alt: 'Cricket Coaching Analysis - AI-Powered Video Analysis'
  }
];

export function ScreenshotCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-rotation every 4 seconds
  useEffect(() => {
    if (!isAutoPlaying || screenshots.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === screenshots.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume auto-play after 8 seconds
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const goToPrevious = () => {
    const newIndex = currentIndex === 0 ? screenshots.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  };

  const goToNext = () => {
    const newIndex = currentIndex === screenshots.length - 1 ? 0 : currentIndex + 1;
    goToSlide(newIndex);
  };

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Main Image Container - Reduced height for horizontal screenshots */}
      <div className="relative h-[240px] bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-white/20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center bg-white"
          >
            {screenshots[currentIndex].image ? (
              <img
                src={screenshots[currentIndex].image}
                alt={screenshots[currentIndex].alt}
                className="w-full h-full object-contain p-2"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-green-500 rounded-xl mx-auto mb-3 opacity-20"></div>
                  <p className="text-sm font-medium">Screenshot Preview</p>
                  <p className="text-xs mt-1">Horizontal layout ready</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows - Only show if multiple images */}
        {screenshots.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Dots indicator - Only show if multiple images */}
      {screenshots.length > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          {screenshots.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex 
                  ? 'bg-white' 
                  : 'bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}