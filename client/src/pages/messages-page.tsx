import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, ArrowLeft, MoreVertical, Send, MessageCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/navbar";
import { QUERY_CONFIGS, debounce } from "@/utils/performance";

interface User {
  id: number;
  fullName: string;
  username: string;
  profilePicture?: string;
}

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: User;
}

interface Conversation {
  id: number;
  user1Id: number;
  user2Id: number;
  user1: User;
  user2: User;
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user conversations with optimized polling
  const { data: conversations = [], refetch: refetchConversations } = useQuery({
    queryKey: ["/api/conversations"],
    ...QUERY_CONFIGS.realtime, // Smart polling configuration
  });

  // Fetch messages for selected conversation with optimized polling
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ["/api/conversations", selectedConversation?.id, "messages"],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await apiRequest("GET", `/api/conversations/${selectedConversation.id}/messages`);
      return await response.json();
    },
    enabled: !!selectedConversation,
    ...QUERY_CONFIGS.realtime, // Smart polling configuration
  });

  // Debounced search to reduce API calls
  const debouncedSearchQuery = useMemo(() => debounce((query: string) => {
    setSearchQuery(query);
  }, 300), []);

  // Search users with debounced query
  const { data: searchResults = [] } = useQuery({
    queryKey: ["/api/users/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const response = await apiRequest("GET", `/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      return await response.json();
    },
    enabled: searchQuery.length >= 2,
    ...QUERY_CONFIGS.static, // Static configuration for search
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedConversation) throw new Error("No conversation selected");
      const response = await apiRequest("POST", `/api/conversations/${selectedConversation.id}/messages`, {
        content
      });
      return await response.json();
    },
    onSuccess: () => {
      setNewMessage("");
      refetchMessages();
      refetchConversations();
      // Invalidate unread count since we sent a message
      queryClient.invalidateQueries({ queryKey: ["/api/conversations/unread-count"] });
      scrollToBottom();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send message",
      });
    },
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("POST", `/api/conversations/${userId}`);
      return await response.json();
    },
    onSuccess: async (conversation) => {
      await refetchConversations();
      // Wait a moment for the refetch to complete, then find the conversation
      setTimeout(() => {
        const updatedConversations = queryClient.getQueryData(["/api/conversations"]) as Conversation[];
        const foundConversation = updatedConversations?.find(c => c.id === conversation.id);
        if (foundConversation) {
          setSelectedConversation(foundConversation);
        }
      }, 100);
      setSearchQuery("");
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await apiRequest("DELETE", `/api/conversations/${conversationId}`);
      return await response.json();
    },
    onSuccess: (_, conversationId) => {
      // Clear the selected conversation if it was deleted
      if (selectedConversation && selectedConversation.id === conversationId) {
        setSelectedConversation(null);
      }
      // Invalidate both conversations list and unread count
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations/unread-count"] });
      toast({
        title: "Success",
        description: "Conversation deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete conversation",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  const handleUserClick = (clickedUser: User) => {
    // Check if conversation already exists
    const existingConversation = conversations.find((conv: Conversation) => 
      (conv.user1Id === user?.id && conv.user2Id === clickedUser.id) ||
      (conv.user2Id === user?.id && conv.user1Id === clickedUser.id)
    );

    if (existingConversation) {
      setSelectedConversation(existingConversation);
      // Mark as read when opening conversation
      apiRequest("PATCH", `/api/conversations/${existingConversation.id}/read`).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/conversations/unread-count"] });
      });
    } else {
      createConversationMutation.mutate(clickedUser.id);
    }
    setSearchQuery("");
  };

  const getOtherUser = (conversation: Conversation): User | null => {
    if (!conversation || !user) return null;
    
    if (conversation.user1Id === user.id) {
      return conversation.user2 || null;
    } else {
      return conversation.user1 || null;
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (!user) return null;

  // Mobile view when conversation is selected
  if (isMobile && selectedConversation) {
    const otherUser = getOtherUser(selectedConversation);
    
    if (!otherUser) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <Navbar />
          <div className="flex items-center justify-center h-[calc(100vh-8rem)] mt-20">
            <div className="text-center">
              <p className="text-gray-500">Loading conversation...</p>
              <Button onClick={() => setSelectedConversation(null)} className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Back to conversations
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navbar />
        <div className="main-content h-[calc(100vh-8rem)] flex flex-col mt-20">
          {/* Mobile Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 border-b border-gray-200 p-4 flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedConversation(null)}
              className="p-2 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div 
              className="flex items-center space-x-3 flex-1 cursor-pointer"
              onClick={() => setLocation(`/profile/${otherUser.id}`)}
            >
              <Avatar className="h-10 w-10 ring-4 ring-white/30">
                <AvatarImage src={otherUser.profilePicture} alt={otherUser.fullName} />
                <AvatarFallback className="bg-white/20 text-white font-bold">
                  {otherUser.fullName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-white text-lg">{otherUser.fullName}</p>
                <p className="text-blue-100">{otherUser.userType}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-4 rounded-full mb-4">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <p className="text-gray-500">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((message: Message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                      message.senderId === user.id
                        ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                        : 'bg-white border border-gray-200 shadow-md'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.senderId === user.id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-3">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl py-3"
              />
              <Button 
                type="submit" 
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl px-6 py-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Desktop view or mobile conversation list
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar />
      <div className="max-w-7xl mx-auto pt-24 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 h-[calc(100vh-16rem)] overflow-hidden">
          <div className="flex h-full">
            {/* Left Section - Conversation List */}
            <div className={`${isMobile ? 'w-full' : 'w-1/3'} border-r border-gray-200 flex flex-col bg-gradient-to-b from-gray-50 to-white`}>
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
                <h1 className="text-xl font-bold text-white mb-4">Messages</h1>
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="pl-10 bg-white/90 backdrop-blur border-white/20 focus:bg-white focus:border-blue-300 transition-all duration-200"
                  />
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-3 border border-blue-200 rounded-xl bg-white shadow-xl max-h-48 overflow-y-auto backdrop-blur-sm">
                    <div className="p-3 text-xs text-blue-600 font-semibold border-b border-blue-100 bg-blue-50">Found Users</div>
                    {searchResults.slice(0, 5).map((searchUser: User) => (
                      <div
                        key={searchUser.id}
                        onClick={() => handleUserClick(searchUser)}
                        className="flex items-center space-x-3 p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all duration-200 border-b border-gray-100 last:border-b-0"
                      >
                        <Avatar className="h-10 w-10 ring-2 ring-blue-100">
                          <AvatarImage src={searchUser.profilePicture} alt={searchUser.fullName} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                            {searchUser.fullName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{searchUser.fullName}</p>
                          <p className="text-xs text-blue-600">@{searchUser.username}</p>
                          <p className="text-xs text-gray-500 mt-1">{searchUser.userType}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-4 rounded-full mb-6">
                      <MessageCircle className="h-12 w-12 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">No conversations yet</h3>
                    <p className="text-gray-600 max-w-sm">Start connecting with other athletes by searching for users above and begin your first conversation!</p>
                  </div>
                ) : (
                  conversations.map((conversation: Conversation) => {
                    const otherUser = getOtherUser(conversation);
                    
                    // Skip rendering if otherUser is not available
                    if (!otherUser) {
                      return null;
                    }
                    
                    return (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`flex items-center space-x-4 p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer border-b border-gray-100 transition-all duration-200 ${
                          selectedConversation?.id === conversation.id ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <Avatar className="h-12 w-12 ring-2 ring-blue-100 shadow-sm">
                          <AvatarImage src={otherUser.profilePicture} alt={otherUser.fullName} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                            {otherUser.fullName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900 truncate">{otherUser.fullName}</p>
                            <div className="flex items-center space-x-2">
                              {conversation.lastMessage && (
                                <span className="text-xs text-blue-600 font-medium">
                                  {formatMessageTime(conversation.lastMessage.createdAt)}
                                </span>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="p-1 h-7 w-7 hover:bg-red-100">
                                    <MoreVertical className="h-4 w-4 text-gray-500" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteConversationMutation.mutate(conversation.id);
                                    }}
                                    className="text-red-600"
                                  >
                                    Delete conversation
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          {conversation.lastMessage && (
                            <p className="text-sm text-gray-500 truncate">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Section - Chat Box (Desktop only) */}
            {!isMobile && (
              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  (() => {
                    const otherUser = getOtherUser(selectedConversation);
                    
                    if (!otherUser) {
                      return (
                        <div className="flex-1 flex items-center justify-center text-center">
                          <div>
                            <p className="text-gray-500">Loading conversation...</p>
                            <Button onClick={() => setSelectedConversation(null)} className="mt-4">
                              Back to conversations
                            </Button>
                          </div>
                        </div>
                      );
                    }
                    
                    return (
                      <>
                        {/* Chat Header */}
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
                          <div 
                            className="flex items-center space-x-4 cursor-pointer"
                            onClick={() => setLocation(`/profile/${otherUser.id}`)}
                          >
                            <Avatar className="h-12 w-12 ring-4 ring-white/30">
                              <AvatarImage src={otherUser.profilePicture} alt={otherUser.fullName} />
                              <AvatarFallback className="bg-white/20 text-white font-bold">
                                {otherUser.fullName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-white text-lg">{otherUser.fullName}</p>
                              <p className="text-blue-100">{otherUser.userType}</p>
                            </div>
                          </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                          {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                              <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-4 rounded-full mb-4">
                                <MessageCircle className="h-8 w-8 text-white" />
                              </div>
                              <p className="text-gray-500">No messages yet. Start the conversation!</p>
                            </div>
                          ) : (
                            messages.map((message: Message) => (
                              <div
                                key={message.id}
                                className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                                    message.senderId === user.id
                                      ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                                      : 'bg-white border border-gray-200 shadow-md'
                                  }`}
                                >
                                  <p className="text-sm leading-relaxed">{message.content}</p>
                                  <p className={`text-xs mt-2 ${
                                    message.senderId === user.id ? 'text-blue-100' : 'text-gray-500'
                                  }`}>
                                    {formatMessageTime(message.createdAt)}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                          <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-200">
                          <form onSubmit={handleSendMessage} className="flex space-x-3">
                            <Input
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Type your message..."
                              className="flex-1 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl py-3"
                            />
                            <Button 
                              type="submit" 
                              disabled={!newMessage.trim() || sendMessageMutation.isPending}
                              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl px-6 py-3"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </form>
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center bg-gradient-to-br from-gray-50 to-white">
                    <div className="max-w-md p-8">
                      <div className="bg-gradient-to-br from-blue-500 to-purple-500 p-6 rounded-full mx-auto mb-6 w-24 h-24 flex items-center justify-center">
                        <MessageCircle className="h-12 w-12 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Connect with Athletes</h3>
                      <p className="text-gray-600 leading-relaxed">Select a conversation from the sidebar to start chatting with fellow athletes and sports enthusiasts. Your messages will appear here in real-time!</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}