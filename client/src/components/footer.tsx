import { useLocation } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";

export function Footer() {
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();

  const handleNavigation = (path: string) => {
    setLocation(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigationLinks = [
    { label: "Home", path: "/" },
    { label: "Feed", path: "/feed" },
    { label: "Sports News", path: "/sports-news" },
    { label: "Do Drills and Earn", path: "/drills" },
    { label: "Tryouts", path: "/tryouts" },
    { label: "Cricket Coaching", path: "/cricket-coaching" },
    { label: "My Profile", path: "/profile" },
    { label: "Terms and Conditions", path: "/terms" },
    { label: "Privacy Policy", path: "/privacy" }
  ];

  if (isMobile) {
    return (
      <footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-green-800 text-white mt-auto">
        <div className="container mx-auto px-6 py-8">
          {/* Mobile Logo and Tagline */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold drop-shadow-lg" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.5px' }}>
              <span className="text-white">SPORTS</span>
              <span className="text-orange-600">APP</span>
            </h2>
            <p className="text-blue-100 text-sm mt-2 font-medium">
              Made with passion of Sports
            </p>
          </div>

          {/* Mobile Links - 3 Columns */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {navigationLinks.map((link, index) => (
              <button
                key={index}
                onClick={() => handleNavigation(link.path)}
                className="text-white text-xs font-semibold py-2 px-1 rounded-lg hover:bg-white/20 transition-all duration-200 active:scale-95"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Mobile Copyright */}
          <div className="text-center mt-6 pt-4 border-t border-white/20">
            <p className="text-blue-100 text-xs">
              © 2025 SportsApp. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-green-800 text-white mt-auto relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
        {/* Stadium lights effect */}
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-yellow-300/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-blue-300/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-8 py-12 relative z-10">
        <div className="flex flex-col md:flex-row items-start justify-between">
          {/* Left Side - Logo and Tagline */}
          <div className="mb-8 md:mb-0">
            <h2 className="text-5xl font-bold drop-shadow-2xl mb-3" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '1px' }}>
              <span className="text-white">SPORTS</span>
              <span className="text-orange-600 drop-shadow-lg">APP</span>
            </h2>
            <p className="text-blue-100 text-lg font-semibold tracking-wide">
              Made with passion of Sports
            </p>
          </div>

          {/* Right Side - Navigation Links */}
          <div className="flex-1 max-w-2xl">
            <div className="grid grid-cols-2 gap-x-12 gap-y-3">
              {/* First Row */}
              <div className="space-y-3">
                {navigationLinks.slice(0, 5).map((link, index) => (
                  <button
                    key={index}
                    onClick={() => handleNavigation(link.path)}
                    className="block text-left text-white font-semibold text-lg hover:text-yellow-300 transition-all duration-200 hover:scale-105 hover:drop-shadow-lg group"
                  >
                    <span className="group-hover:pl-2 transition-all duration-200">
                      {link.label}
                    </span>
                  </button>
                ))}
              </div>
              
              {/* Second Row */}
              <div className="space-y-3">
                {navigationLinks.slice(5).map((link, index) => (
                  <button
                    key={index + 5}
                    onClick={() => handleNavigation(link.path)}
                    className="block text-left text-white font-semibold text-lg hover:text-yellow-300 transition-all duration-200 hover:scale-105 hover:drop-shadow-lg group"
                  >
                    <span className="group-hover:pl-2 transition-all duration-200">
                      {link.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Copyright */}
        <div className="mt-12 pt-6 border-t border-white/30 text-center">
          <p className="text-blue-100 font-medium">
            © 2025 SportsApp. All rights reserved. | Empowering athletes worldwide
          </p>
        </div>
      </div>
    </footer>
  );
}