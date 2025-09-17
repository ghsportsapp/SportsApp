import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Search, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface User {
  id: number;
  fullName: string;
  username: string;
  isVerified: boolean;
  profilePicture?: string;
}

interface SearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchPopup({ isOpen, onClose }: SearchPopupProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Focus input when popup opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Search for users
  const { data: searchResults = [] } = useQuery<User[]>({
    queryKey: ["/api/users/search", searchQuery],
    queryFn: async () => {
      if (searchQuery.trim().length < 1) return [];
      const response = await apiRequest("GET", `/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      return await response.json();
    },
    enabled: searchQuery.trim().length > 0,
    staleTime: 5000,
  });

  const handleUserClick = (user: User) => {
    // Add to recent searches
    const newRecent = [user.username, ...recentSearches.filter(s => s !== user.username)].slice(0, 3);
    setRecentSearches(newRecent);
    localStorage.setItem("recentSearches", JSON.stringify(newRecent));
    
    // Navigate to user profile
    setLocation(`/profile/${user.id}`);
    onClose();
  };

  const handleRecentSearchClick = (username: string) => {
    setSearchQuery(username);
    // Move to top of recent searches
    const newRecent = [username, ...recentSearches.filter(s => s !== username)].slice(0, 3);
    setRecentSearches(newRecent);
    localStorage.setItem("recentSearches", JSON.stringify(newRecent));
  };

  const removeRecentSearch = (username: string) => {
    const newRecent = recentSearches.filter(s => s !== username);
    setRecentSearches(newRecent);
    localStorage.setItem("recentSearches", JSON.stringify(newRecent));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div className={`
        relative bg-white shadow-xl z-50 overflow-hidden
        ${isMobile 
          ? 'w-full h-full' 
          : 'ml-auto w-1/3 min-w-[400px] h-full'
        }
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Search Users</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search by username or full name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Search Results / Suggestions */}
          {searchQuery.trim() && (
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Suggestions</h3>
              {searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.slice(0, 3).map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserClick(user)}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        {user.profilePicture ? (
                          <AvatarImage src={user.profilePicture} alt={user.fullName} />
                        ) : null}
                        <AvatarFallback>{user.fullName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.fullName}
                          </p>
                          {user.isVerified && (
                            <div className="h-4 w-4 bg-blue-600 rounded-full flex items-center justify-center">
                              <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-4">No users found</p>
              )}
            </div>
          )}

          {/* Recent Searches */}
          <div className="p-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Searches</h3>
            {recentSearches.length > 0 ? (
              <div className="space-y-2">
                {recentSearches.map((username) => (
                  <div
                    key={username}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group"
                  >
                    <div 
                      onClick={() => handleRecentSearchClick(username)}
                      className="flex items-center space-x-3 flex-1 cursor-pointer"
                    >
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-700">@{username}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRecentSearch(username)}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 py-4">No recent searches</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}