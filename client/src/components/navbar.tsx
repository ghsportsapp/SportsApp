import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Bell, MessageCircle, Home, Users, FileText, Upload, User, Shield, LogOut, Trophy, Target, Languages, ArrowLeft, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { SearchPopup } from "@/components/search-popup";
import { NotificationDrawer } from "@/components/notification-drawer";
import { InstallButton } from "@/components/install-button";

export function Navbar() {
  const [, setLocation] = useLocation();
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isAdmin, logoutMutation: adminLogoutMutation } = useAdminAuth();
  const isMobile = useIsMobile();
  const [searchPopupOpen, setSearchPopupOpen] = useState(false);
  const [notificationPopupOpen, setNotificationPopupOpen] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const { t, i18n } = useTranslation();

  // Helper function to safely get user initials
  const getInitials = (name?: string, fallback = 'U') => {
    const s = name?.trim().split(/\s+/).map(p => p[0]).join('').slice(0,2);
    return s ? s.toUpperCase() : fallback;
  };

  const currentLanguage = i18n.language || 'en';
  
  const changeLanguage = async (lng: string) => {
    await i18n.changeLanguage(lng);
    localStorage.setItem('app-language', lng);
    setShowLanguageMenu(false);
  };

  // Dynamically determine active nav based on current location
  const getActiveNav = (currentLocation: string) => {
    if (currentLocation === "/") return "home";
    if (currentLocation === "/feed") return "feed";
    if (currentLocation === "/sports-news") return "news";
    if (currentLocation === "/drills") return "drills";
    if (currentLocation.startsWith("/profile")) return "profile";
    if (currentLocation.startsWith("/messages")) return "messages";
    if (currentLocation.startsWith("/tryouts")) return "tryouts";
    if (currentLocation.startsWith("/cricket-coaching")) return "cricket";
    return currentLocation.replace("/", "");
  };

  const activeNav = getActiveNav(location);

  // Fetch user profile for profile picture
  const { data: userProfile } = useQuery({
    queryKey: ["/api/users/profile", user?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${user?.id}/profile`);
      return await response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch unread notification count with optimized polling
  const { data: unreadCount = { count: 0 } } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: () => document.hidden ? 60000 : 30000, // Smart polling based on visibility
    staleTime: 15000, // 15 seconds stale time
  }) as { data: { count: number } };

  // Fetch unread conversations count with optimized polling
  const { data: unreadMessagesCount = { count: 0 } } = useQuery({
    queryKey: ["/api/conversations/unread-count"],
    refetchInterval: () => document.hidden ? 30000 : 15000, // Smart polling based on visibility
    enabled: !!user?.id,
    staleTime: 10000, // 10 seconds stale time
  }) as { data: { count: number } };

  const handleNavClick = (path: string) => {
    setLocation(path);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // PWA Install functionality - integrate with existing PWA system
  const handlePWAInstall = () => {
    // Clear any previous dismissal to allow the prompt to show again
    sessionStorage.removeItem('pwa-install-dismissed');
    
    // Check if we can find the deferred prompt in the global scope
    // or trigger a custom event to show the install prompt
    const event = new CustomEvent('show-pwa-install-prompt');
    window.dispatchEvent(event);
    
    // Fallback: If no prompt is available, show manual install guide
    setTimeout(() => {
      // Check if the prompt appeared, if not show fallback
      if (!document.querySelector('[data-pwa-install-prompt]')) {
        alert('To install this app:\n\n1. On Chrome/Edge: Click the install icon in the address bar\n2. On Safari: Tap Share → Add to Home Screen\n3. On Firefox: Look for the install option in the menu');
      }
    }, 100);
  };

  const navItems = [
    { id: "home", label: t('nav.home'), path: "/" },
    { id: "feed", label: t('nav.feed'), path: "/feed", disabled: false },
    { id: "news", label: t('nav.sportsNews'), path: "/sports-news", disabled: false },
    { id: "drills", label: t('nav.drills'), path: "/drills", disabled: false },
  ];

  const dropdownItems = [
    { icon: Home, label: t('nav.home'), action: () => setLocation("/"), enabled: true },
    { icon: Users, label: t('nav.feed'), action: () => setLocation("/feed"), enabled: true },
    { icon: FileText, label: t('nav.sportsNews'), action: () => setLocation("/sports-news"), enabled: true },
    { icon: Upload, label: t('nav.drills'), action: () => setLocation("/drills"), enabled: true },
    { icon: Trophy, label: t('nav.tryouts'), action: () => setLocation("/tryouts"), enabled: true },
    { icon: Target, label: t('nav.cricketCoaching'), action: () => setLocation("/cricket-coaching"), enabled: true },
    { icon: User, label: t('nav.myProfile'), action: () => setLocation(`/profile/${user?.id}`), enabled: true },
    { icon: Languages, label: t('nav.language'), action: () => setShowLanguageMenu(true), enabled: true },
  ];

  const languageOptions = [
    { code: 'en', label: t('language.english'), flag: '🇺🇸' },
    { code: 'hi', label: t('language.hindi'), flag: '🇮🇳' }
  ];

  if (!user) return null;

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      {/* Desktop Navbar */}
      {!isMobile && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.5px' }}>
                  <span style={{ color: '#283E51' }}>SPORTS</span>
                  <span className="text-orange-600">APP</span>
                </h1>
              </div>
            </div>

            {/* Center Navigation */}
            <div className="flex space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => !item.disabled && handleNavClick(item.path)}
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
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-gray-500 hover:text-gray-700"
                onClick={() => setSearchPopupOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
              
              {/* Notifications Icon */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-gray-500 hover:text-gray-700 relative"
                onClick={() => setNotificationPopupOpen(true)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount.count > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount.count > 99 ? '99+' : unreadCount.count}
                  </span>
                )}
              </Button>
              
              {/* Messages Icon */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-gray-500 hover:text-gray-700 relative"
                onClick={() => setLocation("/messages")}
              >
                <MessageCircle className="h-5 w-5" />
                {unreadMessagesCount.count > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadMessagesCount.count > 99 ? '99+' : unreadMessagesCount.count}
                  </span>
                )}
              </Button>

              {/* Install App Button */}
              <InstallButton />

              {/* Enhanced Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:ring-2 hover:ring-blue-200 hover:ring-offset-2 transition-all duration-200">
                    <Avatar className="h-8 w-8">
                      {userProfile?.profilePicture ? (
                        <AvatarImage src={userProfile.profilePicture} alt={user?.fullName ?? 'User'} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white font-semibold">
                        {getInitials(user?.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-72 p-4 bg-white border-0 shadow-2xl rounded-2xl backdrop-blur-sm relative overflow-hidden max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                  align="end" 
                  forceMount
                  sideOffset={8}
                >
                  {/* Main Menu */}
                  <div className={`space-y-2 transition-all duration-300 ${showLanguageMenu ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100'}`}>
                    {/* User Info Header */}
                    <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl mb-3">
                      <Avatar className="h-10 w-10 mr-3">
                        {userProfile?.profilePicture ? (
                          <AvatarImage src={userProfile.profilePicture} alt={user?.fullName ?? 'User'} />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white font-semibold">
                          {getInitials(user?.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins, Inter, system-ui, sans-serif' }}>
                          {user.fullName}
                        </p>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>
                    </div>

                    {/* Menu Items */}
                    {dropdownItems.map((item, index) => (
                      <div
                        key={item.label}
                        onClick={item.enabled ? item.action : undefined}
                        className={`
                          group relative flex items-center p-3 rounded-xl transition-all duration-300 cursor-pointer
                          ${!item.enabled 
                            ? "text-gray-400 cursor-not-allowed bg-gray-50" 
                            : "text-gray-700 hover:text-white hover:shadow-lg hover:scale-[1.02] bg-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-green-500 border border-gray-100 hover:border-transparent transform-gpu"
                          }
                        `}
                        style={{ 
                          fontFamily: 'Poppins, Inter, system-ui, sans-serif',
                          fontWeight: '600',
                          animationDelay: `${index * 50}ms`
                        }}
                      >
                        <div className={`
                          flex items-center justify-center w-10 h-10 rounded-xl mr-3 transition-all duration-300
                          ${!item.enabled 
                            ? "bg-gray-200" 
                            : "bg-gradient-to-br from-blue-100 to-green-100 group-hover:from-white group-hover:to-white group-hover:shadow-md group-hover:scale-110"
                          }
                        `}>
                          <item.icon className={`h-5 w-5 transition-colors duration-300 ${
                            !item.enabled ? "text-gray-400" : "text-blue-600 group-hover:text-blue-800"
                          }`} />
                        </div>
                        <span className="text-sm font-semibold">
                          {item.label}
                        </span>
                        
                        {/* Animated hover effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                      </div>
                    ))}
                    
                    {/* Elegant Separator */}
                    <div className="relative py-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <div className="w-8 h-px bg-gradient-to-r from-blue-400 to-green-400"></div>
                      </div>
                    </div>
                    
                    {/* PWA Install Button */}
                    <div
                      onClick={handlePWAInstall}
                      className="
                        group relative flex items-center p-3 rounded-xl transition-all duration-300 cursor-pointer
                        text-green-600 hover:text-white hover:shadow-lg hover:scale-[1.02] bg-green-50 hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-600 border border-green-100 hover:border-transparent transform-gpu
                      "
                      style={{ 
                        fontFamily: 'Poppins, Inter, system-ui, sans-serif',
                        fontWeight: '600'
                      }}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl mr-3 bg-green-100 group-hover:bg-white group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                        <Download className="h-5 w-5 text-green-600 group-hover:text-green-800 transition-colors duration-300" />
                      </div>
                      <span className="text-sm font-semibold">
                        {t('nav.installApp', 'Install App')}
                      </span>
                      
                      {/* Animated hover effect */}
                      <div className="absolute inset-0 rounded-xl bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                    </div>
                    
                    {/* Enhanced Logout Button */}
                    <div
                      onClick={handleLogout}
                      className="
                        group relative flex items-center p-3 rounded-xl transition-all duration-300 cursor-pointer
                        text-red-600 hover:text-white hover:shadow-lg hover:scale-[1.02] bg-red-50 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 border border-red-100 hover:border-transparent transform-gpu
                      "
                      style={{ 
                        fontFamily: 'Poppins, Inter, system-ui, sans-serif',
                        fontWeight: '600'
                      }}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-xl mr-3 bg-red-100 group-hover:bg-white group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                        <LogOut className="h-5 w-5 text-red-600 group-hover:text-red-800 transition-colors duration-300" />
                      </div>
                      <span className="text-sm font-semibold">
                        {t('nav.logout')}
                      </span>
                      
                      {/* Animated hover effect */}
                      <div className="absolute inset-0 rounded-xl bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                    </div>
                  </div>

                  {/* Language Selection Overlay */}
                  <div className={`space-y-2 transition-all duration-300 ${showLanguageMenu ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'}`}>
                    {/* Language Header */}
                    <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl mb-3">
                      <button
                        onClick={() => setShowLanguageMenu(false)}
                        className="flex items-center justify-center w-8 h-8 rounded-lg mr-3 bg-white hover:bg-gray-50 transition-colors duration-200"
                      >
                        <ArrowLeft className="h-4 w-4 text-gray-600" />
                      </button>
                      <div>
                        <p className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins, Inter, system-ui, sans-serif' }}>
                          {t('language.selectLanguage')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {t('language.choosePreferred')}
                        </p>
                      </div>
                    </div>

                    {/* Language Options */}
                    {languageOptions.map((lang, index) => (
                      <div
                        key={lang.code}
                        onClick={() => {
                          changeLanguage(lang.code);
                        }}
                        className={`
                          group relative flex items-center p-3 rounded-xl transition-all duration-300 cursor-pointer
                          ${currentLanguage === lang.code 
                            ? "text-white bg-gradient-to-r from-green-500 to-blue-500 shadow-lg" 
                            : "text-gray-700 hover:text-white hover:shadow-lg hover:scale-[1.02] bg-white hover:bg-gradient-to-r hover:from-green-500 hover:to-blue-500 border border-gray-100 hover:border-transparent"
                          }
                          transform-gpu
                        `}
                        style={{ 
                          fontFamily: 'Poppins, Inter, system-ui, sans-serif',
                          fontWeight: '600',
                          animationDelay: `${index * 100}ms`
                        }}
                      >
                        <div className={`
                          flex items-center justify-center w-10 h-10 rounded-xl mr-3 transition-all duration-300 text-2xl
                          ${currentLanguage === lang.code 
                            ? "bg-white/20 scale-110" 
                            : "bg-gradient-to-br from-green-100 to-blue-100 group-hover:bg-white/20 group-hover:scale-110"
                          }
                        `}>
                          {lang.flag}
                        </div>
                        <span className="text-sm font-semibold">{lang.label}</span>
                        
                        {/* Selected indicator */}
                        {currentLanguage === lang.code && (
                          <div className="ml-auto">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                        
                        {/* Animated hover effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                      </div>
                    ))}
                  </div>
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
              <h1 className="text-lg font-bold" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.5px' }}>
                <span style={{ color: '#283E51' }}>SPORTS</span>
                <span className="text-orange-600">APP</span>
              </h1>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-3">
              {/* Search Icon */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-gray-500 hover:text-gray-700"
                onClick={() => setSearchPopupOpen(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
              
              {/* Notifications Icon */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-gray-500 hover:text-gray-700 relative"
                onClick={() => setNotificationPopupOpen(true)}
              >
                <Bell className="h-5 w-5" />
                {unreadCount.count > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-600 rounded-full"></span>
                )}
              </Button>
              
              {/* Messages Icon */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 text-gray-500 hover:text-gray-700 relative"
                onClick={() => setLocation("/messages")}
              >
                <MessageCircle className="h-5 w-5" />
                {unreadMessagesCount.count > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-600 rounded-full"></span>
                )}
              </Button>

              {/* Enhanced Mobile Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:ring-2 hover:ring-blue-200 hover:ring-offset-2 transition-all duration-200">
                    <Avatar className="h-8 w-8">
                      {userProfile?.profilePicture ? (
                        <AvatarImage src={userProfile.profilePicture} alt={user?.fullName ?? 'User'} />
                      ) : null}
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white font-semibold">
                        {getInitials(user?.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-64 p-3 bg-white border-0 shadow-2xl rounded-2xl backdrop-blur-sm relative overflow-hidden max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                  align="end" 
                  forceMount
                  sideOffset={8}
                >
                  {/* Mobile Main Menu */}
                  <div className={`space-y-2 transition-all duration-300 ${showLanguageMenu ? 'opacity-0 pointer-events-none absolute inset-0' : 'opacity-100'}`}>
                    {/* Mobile User Info Header */}
                    <div className="flex items-center p-2 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl mb-3">
                      <Avatar className="h-8 w-8 mr-2">
                        {userProfile?.profilePicture ? (
                          <AvatarImage src={userProfile.profilePicture} alt={user?.fullName ?? 'User'} />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white font-semibold text-xs">
                          {getInitials(user?.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: 'Poppins, Inter, system-ui, sans-serif' }}>
                          {user.fullName}
                        </p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </div>

                    {/* Mobile Menu Items */}
                    {dropdownItems.map((item, index) => (
                      <div
                        key={item.label}
                        onClick={item.enabled ? item.action : undefined}
                        className={`
                          group relative flex items-center p-2.5 rounded-xl transition-all duration-300 cursor-pointer
                          ${!item.enabled 
                            ? "text-gray-400 cursor-not-allowed bg-gray-50" 
                            : "text-gray-700 hover:text-white hover:shadow-lg hover:scale-[1.02] bg-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-green-500 border border-gray-100 hover:border-transparent transform-gpu"
                          }
                        `}
                        style={{ 
                          fontFamily: 'Poppins, Inter, system-ui, sans-serif',
                          fontWeight: '600'
                        }}
                      >
                        <div className={`
                          flex items-center justify-center w-8 h-8 rounded-lg mr-3 transition-all duration-300
                          ${!item.enabled 
                            ? "bg-gray-200" 
                            : "bg-gradient-to-br from-blue-100 to-green-100 group-hover:from-white group-hover:to-white group-hover:shadow-md"
                          }
                        `}>
                          <item.icon className={`h-4 w-4 transition-colors duration-300 ${
                            !item.enabled ? "text-gray-400" : "text-blue-600 group-hover:text-blue-800"
                          }`} />
                        </div>
                        <span className="text-sm font-semibold">
                          {item.label}
                        </span>
                      </div>
                    ))}
                    
                    {/* Mobile Separator */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent my-3"></div>
                    
                    {/* Mobile PWA Install Button */}
                    <div
                      onClick={handlePWAInstall}
                      className="
                        group relative flex items-center p-2.5 rounded-xl transition-all duration-300 cursor-pointer
                        text-green-600 hover:text-white hover:shadow-lg hover:scale-[1.02] bg-green-50 hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-600 border border-green-100 hover:border-transparent transform-gpu mb-2
                      "
                      style={{ 
                        fontFamily: 'Poppins, Inter, system-ui, sans-serif',
                        fontWeight: '600'
                      }}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg mr-3 bg-green-100 group-hover:bg-white group-hover:shadow-md transition-all duration-300">
                        <Download className="h-4 w-4 text-green-600 group-hover:text-green-800 transition-colors duration-300" />
                      </div>
                      <span className="text-sm font-semibold">
                        {t('nav.installApp', 'Install App')}
                      </span>
                    </div>
                    
                    {/* Mobile Logout Button */}
                    <div
                      onClick={handleLogout}
                      className="
                        group relative flex items-center p-2.5 rounded-xl transition-all duration-300 cursor-pointer
                        text-red-600 hover:text-white hover:shadow-lg hover:scale-[1.02] bg-red-50 hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 border border-red-100 hover:border-transparent transform-gpu
                      "
                      style={{ 
                        fontFamily: 'Poppins, Inter, system-ui, sans-serif',
                        fontWeight: '600'
                      }}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg mr-3 bg-red-100 group-hover:bg-white group-hover:shadow-md transition-all duration-300">
                        <LogOut className="h-4 w-4 text-red-600 group-hover:text-red-800 transition-colors duration-300" />
                      </div>
                      <span className="text-sm font-semibold">
                        {t('nav.logout')}
                      </span>
                    </div>
                  </div>

                  {/* Mobile Language Selection Overlay */}
                  <div className={`space-y-2 transition-all duration-300 ${showLanguageMenu ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'}`}>
                    {/* Mobile Language Header */}
                    <div className="flex items-center p-2 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl mb-3">
                      <button
                        onClick={() => setShowLanguageMenu(false)}
                        className="flex items-center justify-center w-6 h-6 rounded-lg mr-2 bg-white hover:bg-gray-50 transition-colors duration-200"
                      >
                        <ArrowLeft className="h-3 w-3 text-gray-600" />
                      </button>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: 'Poppins, Inter, system-ui, sans-serif' }}>
                          {t('language.selectLanguage')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t('language.choosePreferred')}
                        </p>
                      </div>
                    </div>

                    {/* Mobile Language Options */}
                    {languageOptions.map((lang, index) => (
                      <div
                        key={lang.code}
                        onClick={() => {
                          changeLanguage(lang.code);
                        }}
                        className={`
                          group relative flex items-center p-2.5 rounded-xl transition-all duration-300 cursor-pointer
                          ${currentLanguage === lang.code 
                            ? "text-white bg-gradient-to-r from-green-500 to-blue-500 shadow-lg" 
                            : "text-gray-700 hover:text-white hover:shadow-lg hover:scale-[1.02] bg-white hover:bg-gradient-to-r hover:from-green-500 hover:to-blue-500 border border-gray-100 hover:border-transparent"
                          }
                          transform-gpu
                        `}
                        style={{ 
                          fontFamily: 'Poppins, Inter, system-ui, sans-serif',
                          fontWeight: '600',
                          animationDelay: `${index * 100}ms`
                        }}
                      >
                        <div className={`
                          flex items-center justify-center w-8 h-8 rounded-lg mr-3 transition-all duration-300 text-lg
                          ${currentLanguage === lang.code 
                            ? "bg-white/20 scale-110" 
                            : "bg-gradient-to-br from-green-100 to-blue-100 group-hover:bg-white/20 group-hover:scale-110"
                          }
                        `}>
                          {lang.flag}
                        </div>
                        <span className="text-sm font-semibold">{lang.label}</span>
                        
                        {/* Mobile Selected indicator */}
                        {currentLanguage === lang.code && (
                          <div className="ml-auto">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          </div>
                        )}
                        
                        {/* Mobile Animated hover effect */}
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                      </div>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}

      {/* Search Popup */}
      <SearchPopup 
        isOpen={searchPopupOpen} 
        onClose={() => setSearchPopupOpen(false)} 
      />

      {/* Notification Drawer */}
      <NotificationDrawer 
        isOpen={notificationPopupOpen} 
        onClose={() => setNotificationPopupOpen(false)}
        onPostClick={(postId) => {
          setLocation(`/feed?postId=${postId}`);
          setNotificationPopupOpen(false);
        }}
        onProfileClick={(userId) => {
          setLocation(`/profile/${userId}`);
          setNotificationPopupOpen(false);
        }}
      />
    </nav>
  );
}