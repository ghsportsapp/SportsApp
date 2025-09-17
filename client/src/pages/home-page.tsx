import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Target, Trophy } from "lucide-react";
import { memo, useCallback } from "react";
import { LazyImage } from "@/components/lazy-image";


function HomePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  // Sample recent winners data
  const recentWinners = [
    { username: "navii", amount: 200, profilePicture: "/uploads/profilePicture-1752751981762-845056753.png", id: 1 },
    { username: "angad", amount: 242, profilePicture: null, id: 4 },
    { username: "suraj", amount: 311, profilePicture: "/uploads/profilePicture-1753338382291-383097457.png", id: 3 },
    { username: "manishyadav", amount: 275, profilePicture: "/uploads/profilePicture-1754032387989-789819600.png", id: 20 },
  ];

  // Impact stats data
  const impactStats = [
    { number: "200+", description: t('home.impactStats.drillsWeekly') },
    { number: "500+", description: t('home.impactStats.redemptions') },
    { number: "100+", description: t('home.impactStats.coachingUsers') },
  ];

  // Memoized navigation handlers for better performance
  const handleNavigate = useCallback((path: string) => {
    setLocation(path);
  }, [setLocation]);

  const handleProfileClick = useCallback((userId: number) => {
    setLocation(`/profile/${userId}`);
  }, [setLocation]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className={`relative ${isMobile ? 'h-[66vh]' : 'min-h-screen'} flex items-center justify-center overflow-hidden`}>
        {/* AI Generated Clean Sports Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-green-800">
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          {/* Clean Sports Elements Overlay */}
          <div className="absolute inset-0 opacity-15">
            {/* Cricket Bat */}
            <div className="absolute top-16 left-12 w-2 h-24 bg-white rounded-full transform rotate-12"></div>
            <div className="absolute top-20 left-10 w-6 h-6 bg-white rounded-full"></div>
            
            {/* Football */}
            <div className="absolute top-20 right-20 w-16 h-16 border-2 border-white rounded-full">
              <div className="absolute top-2 left-2 w-12 h-12 border border-white rounded-full"></div>
            </div>
            
            {/* Tennis Racket */}
            <div className="absolute bottom-24 left-16 w-12 h-20 border-2 border-white rounded-full"></div>
            <div className="absolute bottom-20 left-18 w-4 h-12 bg-white rounded-full"></div>
            
            {/* Hockey Stick */}
            <div className="absolute bottom-32 right-24 w-3 h-16 bg-white rounded-full transform -rotate-12"></div>
            <div className="absolute bottom-28 right-20 w-8 h-3 bg-white rounded-full"></div>
            
            {/* Badminton Shuttlecock */}
            <div className="absolute top-1/2 left-1/4 w-4 h-6 bg-white rounded-t-full"></div>
            <div className="absolute top-1/2 left-1/4 w-6 h-2 border border-white rounded-full transform translate-y-3"></div>
            
            {/* Athletics Track Lines */}
            <div className="absolute bottom-16 left-1/3 w-24 h-1 bg-white"></div>
            <div className="absolute bottom-12 left-1/3 w-24 h-1 bg-white"></div>
            <div className="absolute bottom-8 left-1/3 w-24 h-1 bg-white"></div>
            
            {/* Kabaddi Court Lines */}
            <div className="absolute top-1/3 right-1/4 w-16 h-1 bg-white"></div>
            <div className="absolute top-1/3 right-1/4 w-1 h-16 bg-white"></div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-green-400 to-orange-400 bg-clip-text text-transparent">
              SportsApp
            </span>
          </h1>
          
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white mb-8 leading-tight">
            {t('home.subtitle')}
          </h2>
          
          <p className="text-lg sm:text-xl text-gray-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            {t('home.description')}
          </p>
          
          {/* CTA Buttons */}
          <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'flex-row space-x-6 justify-center'} mt-8`}>
            <Button
              onClick={() => handleNavigate("/feed")}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-8 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
            >
              {t('home.joinCommunity')}
            </Button>
            <Button
              onClick={() => handleNavigate("/drills")}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white font-semibold py-4 px-8 rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 hover:shadow-xl"
            >
              {t('home.doDrillsAndEarn')}
            </Button>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t('home.impactStats.title')}</h2>
          </div>
          
          <div className={`grid ${isMobile ? 'grid-cols-1 gap-8' : 'grid-cols-3 gap-12'}`}>
            {impactStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl sm:text-5xl font-semibold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <p className="text-lg text-gray-900 font-medium">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Winners Section */}
      <section className="py-16 sm:py-20 bg-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t('home.recentWinners.title')}</h2>
          </div>
          
          <div className={`grid ${isMobile ? 'grid-cols-2 gap-6' : 'grid-cols-4 gap-8'}`}>
            {recentWinners.map((winner) => (
              <div key={winner.id} className="text-center bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="mb-4">
                  <Avatar className="h-16 w-16 mx-auto">
                    <AvatarImage src={winner.profilePicture || undefined} alt={winner.username} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                      {winner.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {winner.username}
                </h3>
                
                <div className="text-2xl font-bold text-green-600 mb-4">
                  ₹{winner.amount}
                </div>
                
                <Button
                  onClick={() => setLocation(`/profile/${winner.id}`)}
                  variant="outline"
                  size="sm"
                  className="w-full hover:bg-blue-50 hover:border-blue-500 hover:text-blue-600"
                >
                  {t('home.recentWinners.viewProfile')}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>


      <Footer />
    </div>
  );
}

export default memo(HomePage);
