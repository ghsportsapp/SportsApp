import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Bell, MessageCircle, Home, Users, FileText, Upload, User, Shield, LogOut } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export function Navbar() {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isAdmin, logoutMutation: adminLogoutMutation } = useAdminAuth();
  const isMobile = useIsMobile();
  const [activeNav, setActiveNav] = useState(location === "/" ? "home" : location.replace("/", ""));

  // Fetch user profile for profile picture
  const { data: userProfile } = useQuery({
    queryKey: ["/api/users/profile", user?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${user?.id}/profile`);
      return await response.json();
    },
    enabled: !!user?.id,
  });

  const handleNavClick = (nav: string, path: string) => {
    setActiveNav(nav);
    setLocation(path);
  };

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        setLocation("/auth");
      },
    });
  };

  const navItems = [
    { id: "home", label: "Home", path: "/" },
    { id: "feed", label: "Feed", path: "/feed", disabled: false },
    { id: "news", label: "Sports News", path: "/news", disabled: true },
    { id: "drills", label: "Upload Drills", path: "/drills", disabled: true },
  ];

  const dropdownItems = [
    { icon: Home, label: "Home", action: () => setLocation("/"), enabled: true },
    { icon: Users, label: "Feed", action: () => setLocation("/feed"), enabled: true },
    { icon: FileText, label: "Sports News", action: () => {}, enabled: false },
    { icon: Upload, label: "Do Drills and Earn", action: () => {}, enabled: false },
    { icon: User, label: "My Profile", action: () => setLocation(`/profile/${user?.id}`), enabled: true },
    ...(isAdmin ? [{ icon: Shield, label: "Admin Panel", action: () => setLocation("/admin"), enabled: true }] : []),
  ];

  if (!user) return null;

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      {/* Desktop Navbar */}
      {!isMobile && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">SportsApp</span>
              </div>
            </div>

            {/* Center Navigation */}
            <div className="flex space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && handleNavClick(item.id, item.path)}
                  className={`px-1 pb-4 pt-1 border-b-2 text-sm font-medium transition-colors ${
                    activeNav === item.id
                      ? "border-blue-600 text-blue-600"
                      : item.disabled
                      ? "border-transparent text-gray-400 cursor-not-allowed"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  disabled={item.disabled}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-4">
              {/* Search Icon */}
              <Button variant="ghost" size="sm" className="p-2 text-gray-500 hover:text-gray-700">
                <Search className="h-5 w-5" />
              </Button>
              
              {/* Notifications Icon */}
              <Button variant="ghost" size="sm" className="p-2 text-gray-500 hover:text-gray-700 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                  2
                </span>
              </Button>
              
              {/* Messages Icon */}
              <Button variant="ghost" size="sm" className="p-2 text-gray-500 hover:text-gray-700 relative">
                <MessageCircle className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
                  5
                </span>
              </Button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" />
                      <AvatarFallback>{user.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  {dropdownItems.map((item) => (
                    <DropdownMenuItem
                      key={item.label}
                      onClick={item.enabled ? item.action : undefined}
                      disabled={!item.enabled}
                      className={!item.enabled ? "text-gray-400 cursor-not-allowed" : ""}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/admin")}>
                    <Shield className="mr-3 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-3 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navbar */}
      {isMobile && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <span className="ml-2 text-lg font-bold text-gray-900">SportsApp</span>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-3">
              {/* Search Icon */}
              <Button variant="ghost" size="sm" className="p-2 text-gray-500 hover:text-gray-700">
                <Search className="h-5 w-5" />
              </Button>
              
              {/* Notifications Icon */}
              <Button variant="ghost" size="sm" className="p-2 text-gray-500 hover:text-gray-700 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-600 rounded-full"></span>
              </Button>
              
              {/* Messages Icon */}
              <Button variant="ghost" size="sm" className="p-2 text-gray-500 hover:text-gray-700 relative">
                <MessageCircle className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-600 rounded-full"></span>
              </Button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face" />
                      <AvatarFallback>{user.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  {dropdownItems.map((item) => (
                    <DropdownMenuItem
                      key={item.label}
                      onClick={item.enabled ? item.action : undefined}
                      disabled={!item.enabled}
                      className={!item.enabled ? "text-gray-400 cursor-not-allowed" : ""}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLocation("/admin")}>
                    <Shield className="mr-3 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-3 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
