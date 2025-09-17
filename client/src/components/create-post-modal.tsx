import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserSearchModal } from "@/components/user-search-modal";
import { Type, Image, Video, AtSign, Tag, X, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import type { User } from "@shared/schema";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PostType = "text" | "photo" | "video";

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { startPostUpload } = useUpload();
  const [step, setStep] = useState<"type" | "create">("type");
  const [postType, setPostType] = useState<PostType>("text");
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mentions, setMentions] = useState<User[]>([]);
  const [tags, setTags] = useState<User[]>([]);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);
  const [searchType, setSearchType] = useState<"mention" | "tag">("mention");

  const createPostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
        // Add timeout and keep-alive for faster uploads
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to create post");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all post-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts/stats"] });
      
      // Invalidate user profile queries to update post count and posts list immediately
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
      
      // Invalidate current user session data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: t('posts.createPost'),
        description: t('posts.postCreated'),
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setStep("type");
    setPostType("text");
    setContent("");
    setMediaFile(null);
    setMediaPreview(null);
    setMentions([]);
    setTags([]);
    onClose();
  };

  const handleTypeSelect = (type: PostType) => {
    setPostType(type);
    setStep("create");
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUserSelect = (user: User) => {
    if (searchType === "mention") {
      if (!mentions.find(m => m.id === user.id)) {
        setMentions([...mentions, user]);
        // Insert mention in content
        setContent(prev => prev + `@${user.username} `);
      }
    } else {
      if (!tags.find(t => t.id === user.id)) {
        setTags([...tags, user]);
      }
    }
    setIsUserSearchOpen(false);
  };

  const removeMention = (userId: number) => {
    const user = mentions.find(m => m.id === userId);
    if (user) {
      setMentions(mentions.filter(m => m.id !== userId));
      setContent(prev => prev.replace(`@${user.username} `, ""));
    }
  };

  const removeTag = (userId: number) => {
    setTags(tags.filter(t => t.id !== userId));
  };

  const handleSubmit = async () => {
    // Validation for text posts or posts without media
    if (!content.trim() && !mediaFile) {
      toast({
        title: t('posts.contentRequired'),
        description: t('posts.addContentError'),
        variant: "destructive",
      });
      return;
    }

    // For text posts (no media), use the traditional approach
    if (postType === "text" || !mediaFile) {
      const formData = new FormData();
      formData.append("type", postType);
      formData.append("content", content);
      
      if (mentions.length > 0) {
        formData.append("mentions", JSON.stringify(mentions.map(m => m.id)));
      }
      
      if (tags.length > 0) {
        formData.append("tags", JSON.stringify(tags.map(t => t.id)));
      }

      createPostMutation.mutate(formData);
      return;
    }

    // For media posts, use the progressive upload system
    try {
      // Close modal immediately and start upload
      handleClose();
      
      await startPostUpload({
        type: postType,
        content: content || undefined,
        mentions: mentions.length > 0 ? JSON.stringify(mentions.map(m => m.id)) : undefined,
        tags: tags.length > 0 ? JSON.stringify(tags.map(t => t.id)) : undefined,
        file: mediaFile,
      });

      // Show success message
      toast({
        title: t('posts.uploadStarted'),
        description: t('posts.uploadStartedDescription'),
      });
      
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('posts.uploadError'),
        variant: "destructive",
      });
    }
  };

  const postTypes = [
    {
      type: "text" as PostType,
      icon: Type,
      title: t('posts.textPost'),
      description: t('posts.textPostDesc'),
    },
    {
      type: "photo" as PostType,
      icon: Image,
      title: t('posts.photoPost'),
      description: t('posts.photoPostDesc'),
    },
    {
      type: "video" as PostType,
      icon: Video,
      title: t('posts.videoPost'),
      description: t('posts.videoPostDesc'),
    },
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg max-w-lg max-h-[90vh] overflow-y-auto bg-[#f5f5f5]">
          <DialogHeader>
            <DialogTitle>
              {step === "type" ? t('posts.createPost') : `${t('posts.createPost')} - ${t(`posts.${postType}Post`)}`}
            </DialogTitle>
          </DialogHeader>

          {step === "type" ? (
            <div className="space-y-4">
              {postTypes.map((type, index) => (
                <Card
                  key={type.type}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-l-4 border-transparent hover:border-blue-500"
                  onClick={() => handleTypeSelect(type.type)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                        type.type === 'text' 
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                          : type.type === 'photo' 
                          ? 'bg-gradient-to-br from-green-500 to-teal-500' 
                          : 'bg-gradient-to-br from-red-500 to-orange-500'
                      }`}>
                        <type.icon className="h-6 w-6 text-white animate-pulse" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{type.title}</h3>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Sports Content Disclaimer */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">!</span>
                    </div>
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    {i18n.language === 'hi' ? (
                      <p>
                        कृपया सुनिश्चित करें कि केवल खेल से संबंधित सामग्री ही अपलोड की जाए। जो पोस्ट इससे मेल नहीं खाती, उन्हें हटाया जा सकता है। समझने के लिए धन्यवाद!
                      </p>
                    ) : (
                      <p>
                        Kindly ensure that only sports-related content is uploaded. Posts that do not align with this may be removed. Thank you for understanding!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Media Upload */}
              {(postType === "photo" || postType === "video") && (
                <div>
                  <Label htmlFor="media">{t('posts.uploadMedia')} {t(`posts.${postType}`)}</Label>
                  <Input
                    id="media"
                    type="file"
                    accept={postType === "photo" ? "image/*" : "video/*"}
                    onChange={handleMediaChange}
                    className="mt-2"
                  />
                  
                  {mediaPreview && (
                    <div className="mt-4 relative">
                      {postType === "photo" ? (
                        <img
                          src={mediaPreview}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={mediaPreview}
                          className="w-full h-48 object-cover rounded-lg"
                          controls
                        />
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setMediaFile(null);
                          setMediaPreview(null);
                        }}
                        className="absolute top-2 right-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Caption/Content */}
              <div>
                <Label htmlFor="content">
                  {postType === "text" ? t('posts.content') : `${t('posts.caption')} (${t('posts.optional')})`}
                </Label>
                <Textarea
                  id="content"
                  placeholder={t('posts.shareThoughts')}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="mt-2"
                />
              </div>

              {/* Mentions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>{t('posts.mentions')}</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchType("mention");
                      setIsUserSearchOpen(true);
                    }}
                  >
                    <AtSign className="h-4 w-4 mr-1" />
                    {t('posts.mentionUsers')}
                  </Button>
                </div>
                
                {mentions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {mentions.map((user) => (
                      <Badge
                        key={user.id}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        @{user.username}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeMention(user.id)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags (for photo/video) */}
              {(postType === "photo" || postType === "video") && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>{t('posts.tags')}</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchType("tag");
                        setIsUserSearchOpen(true);
                      }}
                    >
                      <Tag className="h-4 w-4 mr-1" />
                      {t('posts.tagUsers')}
                    </Button>
                  </div>
                  
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((user) => (
                        <Badge
                          key={user.id}
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          {user.username}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeTag(user.id)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("type")}
                  className="flex-1"
                >
                  {t('common.back')}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createPostMutation.isPending}
                  className="flex-1 text-white font-semibold shadow-lg transform transition-all duration-200 hover:scale-[1.02]"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #4B79A1 0%, #283E51 51%, #4B79A1 100%)',
                    backgroundSize: '200% auto',
                    transition: 'background-position 0.5s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundPosition = 'right center';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundPosition = 'left center';
                  }}
                >
                  {createPostMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('posts.creating')}
                    </>
                  ) : (
                    t('posts.createPost')
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <UserSearchModal
        isOpen={isUserSearchOpen}
        onClose={() => setIsUserSearchOpen(false)}
        onSelect={handleUserSelect}
        title={t('posts.selectUsers', { type: searchType === "mention" ? t('posts.mention') : t('posts.tag') })}
      />
    </>
  );
}