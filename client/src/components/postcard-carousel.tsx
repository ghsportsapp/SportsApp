import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

interface PostcardSlide {
  id: number;
  image: string;
  title: string;
  description: string;
  gradient?: string;
}

// Real slides with user's compressed images
const drillImage = '/compressed/drill_1755778928318.jpg';
const feedImage = '/compressed/feed_1755778923034.jpg';
const moneyImage = '/compressed/money_1755778915419.jpg';
const tryoutImage = '/compressed/tryout_1755778938488.jpg';
const coachingImage = '/compressed/coaching_1755778942801.jpg';
const newsImage = '/compressed/news_1755778948372.jpg';

const defaultSlides: PostcardSlide[] = [
  {
    id: 1,
    image: drillImage,
    title: '',
    description: 'Athletes are uploading their training drills, upskilling themselves, and turning their hard work into real rewards.',
    gradient: 'from-blue-600 to-green-600'
  },
  {
    id: 2,
    image: feedImage,
    title: '',
    description: 'Navneet just shared his sports update on SportsApp — grabbing attention, building his community, and even earning real money!',
    gradient: 'from-orange-500 to-amber-600'
  },
  {
    id: 3,
    image: moneyImage,
    title: '',
    description: 'Over 10,000 athletes are already earning real money by posting their sports updates on SportsApp. Start today — your game can pay!',
    gradient: 'from-green-600 to-emerald-600'
  },
  {
    id: 4,
    image: tryoutImage,
    title: '',
    description: 'On SportsApp, athletes are applying for tryouts, getting selected, and even securing entries into tournaments — all in one place.',
    gradient: 'from-purple-600 to-indigo-600'
  },
  {
    id: 5,
    image: coachingImage,
    title: '',
    description: 'Cricketers are taking free AI-powered coaching on SportsApp, enhancing their techniques and boosting their performance.',
    gradient: 'from-teal-600 to-cyan-600'
  },
  {
    id: 6,
    image: newsImage,
    title: '',
    description: 'Get all the latest updates, stories, and highlights from the sports world in one place. Stay connected — join SportsApp now!',
    gradient: 'from-slate-600 to-blue-600'
  }
];

interface PostcardCarouselProps {
  slides?: PostcardSlide[];
  autoplay?: boolean;
  autoplayDelay?: number;
}

export function PostcardCarousel({ 
  slides = defaultSlides, 
  autoplay = true, 
  autoplayDelay = 4000 
}: PostcardCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(0);
  const autoplayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!api) return;

    setCurrentSlide(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrentSlide(api.selectedScrollSnap());
      setProgress(0);
    });
  }, [api]);

  // Auto-advance functionality
  useEffect(() => {
    if (!autoplay || isHovered || !api) return;

    autoplayIntervalRef.current = setInterval(() => {
      api.scrollNext();
    }, autoplayDelay);

    return () => {
      if (autoplayIntervalRef.current) {
        clearInterval(autoplayIntervalRef.current);
      }
    };
  }, [autoplay, autoplayDelay, isHovered, api]);

  // Progress bar animation
  useEffect(() => {
    if (!autoplay || isHovered) {
      setProgress(0);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      return;
    }

    setProgress(0);
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 0;
        }
        return prev + (100 / (autoplayDelay / 100));
      });
    }, 100);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [autoplay, autoplayDelay, isHovered, currentSlide]);

  return (
    <div className="w-full max-w-5xl mx-auto px-2">
      <Carousel
        setApi={setApi}
        opts={{
          align: "center",
          loop: true,
        }}
        className="w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CarouselContent className="-ml-1 md:-ml-2">
          {slides.map((slide, index) => (
            <CarouselItem key={slide.id} className="pl-1 md:pl-2 md:basis-1/2 lg:basis-1/2">
              <div className="p-1">
                <PostcardCard slide={slide} isActive={index === currentSlide} progress={progress} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-12 h-12 w-12 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white" />
        <CarouselNext className="hidden md:flex -right-12 h-12 w-12 bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white" />
      </Carousel>
      
      {/* Progress indicator */}
      <div className="flex justify-center mt-4 space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (api) api.scrollTo(index);
            }}
            className={`h-1 rounded-full transition-all duration-300 relative overflow-hidden ${
              index === currentSlide 
                ? 'bg-white/30 w-12' 
                : 'bg-white/20 hover:bg-white/30 w-8'
            }`}
          >
            {index === currentSlide && (
              <motion.div
                className="absolute top-0 left-0 h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

interface PostcardCardProps {
  slide: PostcardSlide;
  isActive?: boolean;
  progress?: number;
}

function PostcardCard({ slide, isActive = false, progress = 0 }: PostcardCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group"
    >
      <Card className="overflow-hidden border-none shadow-xl bg-white/95 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
        <CardContent className="p-0">
          {/* Image Container with Postcard Style */}
          <div className="relative h-64 md:h-72 overflow-hidden">
            {/* Background Image or Gradient */}
            {slide.image ? (
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{
                  backgroundImage: `url(${slide.image})`,
                }}
              >
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient || 'from-blue-600 to-purple-600'}`}>
                {/* Pattern overlay for visual interest */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] bg-repeat" />
                </div>
              </div>
            )}
            
            {/* Postcard Elements */}
            <div className="absolute top-4 right-4">
              <div className="w-8 h-6 bg-white/20 backdrop-blur-sm rounded border border-white/30" />
            </div>
            <div className="absolute top-4 left-4">
              <motion.div
                animate={{ rotate: [0, 1, -1, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="text-white/80 text-sm font-mono"
              >
                ✉
              </motion.div>
            </div>
            
            {/* Corner decoration */}
            <div className="absolute bottom-4 left-4">
              <div className="w-12 h-12 border-2 border-white/30 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <span className="text-white text-xl">🏆</span>
              </div>
            </div>
          </div>
          
          {/* Text Content - Only Description */}
          <div className="p-5 bg-white">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-600 leading-relaxed text-sm md:text-base font-normal"
            >
              {slide.description}
            </motion.p>
            
            {/* Progress line - only show on active card */}
            {isActive && (
              <div className="mt-3 h-0.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            )}
          </div>
          
          {/* Postcard styling elements */}
          <div className="absolute top-6 right-6 opacity-10">
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="w-1 h-1 bg-white rounded-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}