import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { PostcardCarousel } from '@/components/postcard-carousel';

const ANIMATION_VARIANTS = {
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
  },
  fadeInDown: {
    initial: { opacity: 0, y: -30 },
    animate: { opacity: 1, y: 0 }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 }
  }
};

export default function LandingPage(): React.JSX.Element {
  const [, setLocation] = useLocation();

  const handleSignupClick = useCallback(() => setLocation('/signup'), [setLocation]);
  const handleLoginClick = useCallback(() => setLocation('/login'), [setLocation]);

  return (
    <div className="landing-page min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-green-800 relative overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      
      {/* Main Container */}
      <div className="relative z-20 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex-shrink-0 pt-28 pb-12 text-center">
          <motion.h1 
            {...ANIMATION_VARIANTS.fadeInDown}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-bold text-white mb-3 font-inter"
          >
            <span className="text-white">SPORTS</span>
            <span className="text-yellow-300">APP</span>
          </motion.h1>
          <motion.p 
            {...ANIMATION_VARIANTS.fadeInUp}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-blue-100 font-medium mb-3"
          >
            The Ultimate Sports Community
          </motion.p>
          <motion.div 
            {...ANIMATION_VARIANTS.fadeInUp}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-base md:text-lg font-bold tracking-wide flex items-center justify-center gap-2 relative"
          >
            <span className="absolute -left-6 text-yellow-300 animate-pulse">✨</span>
            <span className="absolute -right-6 text-yellow-300 animate-pulse delay-500">✨</span>
            <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent drop-shadow-lg">
              Earn money for likes
            </span>
          </motion.div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-2 md:px-4 pb-2 -mt-16">
          <div className="w-full max-w-5xl">
            <motion.div
              {...ANIMATION_VARIANTS.scaleIn}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <PostcardCarousel />
            </motion.div>

            {/* CTA Section */}
            <section className="text-center mb-4 mt-6">
              <motion.div
                {...ANIMATION_VARIANTS.fadeInUp}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-row items-center justify-center gap-4"
              >
                <Button
                  onClick={handleSignupClick}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-normal py-3 px-6 text-base rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 min-h-[48px] min-w-[140px]"
                >
                  Sign Up
                </Button>
                <Button
                  onClick={handleLoginClick}
                  size="lg"
                  className="bg-white/10 hover:bg-white/20 text-white font-normal py-3 px-6 text-base rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 min-h-[48px] min-w-[100px] border border-white/30"
                >
                  Login
                </Button>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                className="text-white/70 text-sm mt-3"
              >
                Join thousands of athletes and sports fans today
              </motion.p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}