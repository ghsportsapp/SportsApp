import { Upload, Users, PlayCircle, Newspaper, Coins } from "lucide-react";

const SPORTS_FEATURES = [
  { icon: Upload, title: "Upload Talent", description: "Showcase your skills" },
  { icon: Users, title: "Apply Tryouts", description: "Join competitions" },
  { icon: PlayCircle, title: "Drill Videos", description: "Enhance your skills" },
  { icon: Newspaper, title: "Sports News", description: "Stay updated" }
];

interface SportsFeaturesProps {
  isMobile?: boolean;
  showForLogin?: boolean;
}

export function SportsFeatures({ isMobile = false, showForLogin = false }: SportsFeaturesProps) {
  const cardClass = isMobile 
    ? "bg-gradient-to-br from-slate-900 via-blue-900 to-green-800 rounded-xl p-3 text-white"
    : "bg-gradient-to-br from-slate-900 via-blue-900 to-green-800 rounded-2xl p-5 text-white transform hover:scale-105 transition-all duration-300 hover:shadow-2xl";

  return (
    <>
      <div className={isMobile ? "grid grid-cols-2 gap-3 mb-3" : "grid grid-cols-2 gap-4 mb-6"}>
        {SPORTS_FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className={cardClass}>
            <Icon className={`mx-auto mb-${isMobile ? '1' : '3'} ${isMobile ? 'h-6 w-6' : 'h-10 w-10'}`} />
            <h3 className={`font-bold ${isMobile ? 'text-xs' : 'text-base'} ${isMobile ? '' : 'mb-1'}`}>
              {title}
            </h3>
            {!isMobile && <p className="text-xs opacity-90">{description}</p>}
          </div>
        ))}
      </div>
      
      {/* Points to Money Card */}
      <div className="mb-4">
        <div className={`bg-gradient-to-br from-slate-900 via-blue-900 to-green-800 rounded-${isMobile ? 'xl' : '2xl'} p-${isMobile ? '4' : '6'} text-white ${!isMobile ? 'transform hover:scale-105 transition-all duration-300 hover:shadow-2xl' : ''}`}>
          <div className={`flex items-center justify-center mb-${isMobile ? '2' : '3'}`}>
            <Coins className={isMobile ? 'h-8 w-8' : 'h-12 w-12'} />
          </div>
          <p className={`text-${isMobile ? 'sm' : 'lg'} font-bold text-center ${!isMobile ? 'mb-2' : ''}`}>
            Turn points into real money once eligible!
          </p>
        </div>
      </div>
    </>
  );
}