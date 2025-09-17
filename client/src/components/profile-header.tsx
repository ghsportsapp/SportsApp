import { memo, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, Edit, Gift, FileText, Key } from "lucide-react";

interface UserProfile {
  id: number;
  fullName: string;
  username: string;
  email: string;
  bio?: string;
  profilePicture?: string;
  isVerified: boolean;
  verificationStatus: string;
  verificationRequestDate?: string;
  points: number;
  createdAt: string;
  postsCount?: number;
}

interface ProfileHeaderProps {
  userProfile: UserProfile;
  userPosts: any[];
  isOwnProfile: boolean;
  totalPoints: number;
  onEditProfile: () => void;
  getVerificationButton: () => JSX.Element | null;
  onShowRedeemHistory: () => void;
  onChangePassword: () => void;
  onRedeemPoints: () => void;
}

export const ProfileHeader = memo<ProfileHeaderProps>(({ 
  userProfile, 
  userPosts,
  isOwnProfile, 
  totalPoints, 
  onEditProfile, 
  getVerificationButton, 
  onShowRedeemHistory,
  onChangePassword,
  onRedeemPoints
}) => {
  const { t } = useTranslation();
  
  // Memoized avatar fallback to prevent unnecessary recalculations
  const avatarFallback = useMemo(() => {
    if (!userProfile.fullName) return 'U';
    return userProfile.fullName.split(' ').map(n => n[0]).join('');
  }, [userProfile.fullName]);
  
  // Memoized stats to prevent unnecessary re-renders
  const stats = useMemo(() => ({
    posts: userPosts?.length || 0,
    points: totalPoints || 0
  }), [userPosts?.length, totalPoints]);
  
  return (
    <Card className="mb-6" style={{ backgroundColor: 'rgba(40, 62, 81, 0.08)' }}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Profile Picture */}
          <Avatar className="h-24 w-24 md:h-32 md:w-32">
            {userProfile.profilePicture ? (
              <AvatarImage src={userProfile.profilePicture} alt={userProfile.fullName || 'User'} />
            ) : null}
            <AvatarFallback className="text-2xl">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>

          {/* Profile Info */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-semibold text-gray-900">{userProfile.fullName || 'User'}</h1>
                {userProfile.isVerified && (
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                )}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-600">@{userProfile.username || 'unknown'}</span>
              </div>
              <p className="text-gray-600">
                {userProfile.bio || "No bio added"}
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.posts}</div>
                <div className="text-sm text-gray-600">Posts</div>
              </div>
              {isOwnProfile && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.points}</div>
                  <div className="text-sm text-gray-600">Available Points</div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {isOwnProfile && (
            <div className="flex flex-col gap-3 w-full md:w-auto">
              <Button 
                variant="outline" 
                onClick={onEditProfile}
                className="w-full"
                data-testid="button-edit-profile"
              >
                <Edit className="h-4 w-4 mr-2" />
                {t('profile.editProfile')}
              </Button>
              
              {getVerificationButton()}
              
              <Button 
                variant="outline"
                onClick={onChangePassword}
                className="w-full"
                data-testid="button-change-password"
              >
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              
              {userProfile.isVerified && (
                <div className="flex gap-2">
                  <Button 
                    variant="default"
                    onClick={onRedeemPoints}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    data-testid="button-redeem-points"
                  >
                    <Gift className="h-4 w-4 mr-2" />
                    {t('common.save') === 'Save' ? 'Redeem' : (t('common.save') === 'सहेजें' ? 'रिडीम' : 'Redeem')}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={onShowRedeemHistory}
                    className="flex-1"
                    data-testid="button-redeem-history"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {t('common.save') === 'Save' ? 'History' : (t('common.save') === 'सहेजें' ? 'इतिहास' : 'History')}
                  </Button>
                </div>
              )}

              {userProfile.verificationStatus === "pending" && (
                <p className="text-xs text-gray-500 text-center">
                  (You need to be verified to redeem your points.)
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

ProfileHeader.displayName = "ProfileHeader";