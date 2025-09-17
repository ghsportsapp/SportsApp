import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Gift, 
  Star, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Wallet,
  Trophy,
  Mail,
  Clock
} from "lucide-react";

interface UserProfile {
  id: number;
  fullName: string;
  username: string;
  isVerified: boolean;
  points: number;
}

interface RedemptionHistory {
  id: number;
  pointsRedeemed: number;
  moneyAmount: number;
  status: string;
  email: string;
  createdAt: string;
}

export default function RedeemPointsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  const MIN_POINTS_REQUIRED = 5;
  const calculateRedeemableAmount = (points: number) => Math.floor(points / 5);

  // Fetch user profile with points - real-time updates for drill approvals
  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/users/profile", user?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${user?.id}/profile`);
      return await response.json();
    },
    enabled: !!user?.id,
    refetchInterval: 2000, // Auto-refresh every 2 seconds for real-time points updates
    refetchOnWindowFocus: true,
    staleTime: 1000, // Consider fresh for only 1 second for immediate updates
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Fetch redemption history - optimized for real-time updates
  const { data: redemptionHistory = [] } = useQuery<RedemptionHistory[]>({
    queryKey: ["/api/users", user?.id, "redemptions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${user?.id}/redemptions`);
      return await response.json();
    },
    enabled: !!user?.id,
    staleTime: 10000, // Consider fresh for 10 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Auto-refetch every 30 seconds
  });

  // Use user's current points from profile
  const currentPoints = userProfile?.points || 0;
  const canRedeem = currentPoints >= MIN_POINTS_REQUIRED;
  const pointsNeeded = MIN_POINTS_REQUIRED - currentPoints;
  const redeemableAmount = calculateRedeemableAmount(currentPoints);

  // Redeem money mutation
  const redeemMoneyMutation = useMutation({
    mutationFn: async (emailAddress: string) => {
      const response = await apiRequest("POST", `/api/users/${user?.id}/redeem-money`, {
        pointsRedeemed: currentPoints,
        email: emailAddress,
      });
      return await response.json();
    },
    onSuccess: () => {
      // Invalidate all relevant queries to update points immediately
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/profile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "redemptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "profile"] });
      
      // Also set optimistic update for immediate feedback
      queryClient.setQueryData(["/api/users/profile", user?.id], (oldData: any) => {
        if (oldData) {
          return { ...oldData, points: 0 };
        }
        return oldData;
      });
      
      setShowEmailForm(false);
      setEmail("");
      toast({
        title: t('redeem.submittedTitle'),
        description: t('redeem.submittedMessage'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('redeem.redemptionFailed'),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRedeem = () => {
    if (currentPoints < MIN_POINTS_REQUIRED) {
      toast({
        title: t('redeem.insufficientPoints'),
        description: t('redeem.insufficientMessage'),
        variant: "destructive",
      });
      return;
    }
    setShowEmailForm(true);
  };

  const handleSubmitRedemption = () => {
    if (!email || !email.includes('@')) {
      toast({
        title: t('redeem.invalidEmail'),
        description: t('redeem.invalidEmailMessage'),
        variant: "destructive",
      });
      return;
    }
    redeemMoneyMutation.mutate(email);
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('redeem.loadingPage')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile?.isVerified) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('redeem.verificationRequired')}</h1>
              <p className="text-gray-600 mb-6">
                {t('redeem.verificationMessage')}
              </p>
              <Button onClick={() => setLocation(`/profile/${user?.id}`)}>
                {t('redeem.goToProfile')}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation(`/profile/${user?.id}`)}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{t('redeem.pageTitle')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Points Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                {t('redeem.yourPoints')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{currentPoints}</div>
                <div className="text-sm text-gray-600">{t('redeem.availablePoints')}</div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{t('redeem.redeemableAmount')}</span>
                  <span className="text-lg font-bold text-green-600">₹{redeemableAmount}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {t('redeem.conversion')}
                </div>
              </div>

              {canRedeem ? (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">{t('redeem.readyToRedeem')}</span>
                  </div>
                  <p className="text-sm text-green-700">
                    {t('redeem.enoughPoints', { amount: redeemableAmount })}
                  </p>
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-800">{t('redeem.needMorePoints')}</span>
                  </div>
                  <p className="text-sm text-orange-700">
                    {t('redeem.needMorePointsMessage', { count: pointsNeeded })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Redemption Action */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                {t('redeem.redeemMoney')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-6 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg">
                <Gift className="h-12 w-12 mx-auto mb-3" />
                <div className="text-2xl font-bold mb-1">₹{redeemableAmount}</div>
                <div className="text-green-100">{t('redeem.availableToRedeem')}</div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('redeem.minimumRequired')}</span>
                  <span className="font-medium">{MIN_POINTS_REQUIRED} {t('redeem.points')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('redeem.yourPointsLabel')}</span>
                  <span className="font-medium">{currentPoints}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('redeem.redeemableAmount')}:</span>
                  <span className="font-medium text-green-600">₹{redeemableAmount}</span>
                </div>
              </div>

              {showEmailForm ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      {t('redeem.enterEmail')}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('redeem.emailPlaceholder')}
                      className="mt-1"
                    />
                  </div>
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                    <p className="text-sm text-orange-800">
                      {t('redeem.reviewMessage')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmitRedemption}
                      disabled={redeemMoneyMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {redeemMoneyMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t('common.submit')}...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          {t('redeem.redeemNow')}
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => setShowEmailForm(false)}
                      variant="outline"
                      disabled={redeemMoneyMutation.isPending}
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleRedeem}
                  disabled={!canRedeem || redeemMoneyMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300"
                  size="lg"
                >
                  {redeemMoneyMutation.isPending ? (
                    t('common.loading')
                  ) : canRedeem ? (
                    `${t('redeem.redeemMoney')} ₹${redeemableAmount}`
                  ) : (
                    t('redeem.needMorePointsMessage', { count: pointsNeeded })
                  )}
                </Button>
              )}

              <p className="text-xs text-gray-500 text-center">
                {t('redeem.approvalNote')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Redemption History */}
        {redemptionHistory.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                {t('redeem.redeemHistory', { defaultValue: 'Redeem History' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {redemptionHistory.map((redemption) => (
                  <div key={redemption.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">₹{Math.floor(redemption.pointsRedeemed / 5)}</div>
                      <div className="text-sm text-gray-600">
                        {redemption.pointsRedeemed} {t('redeem.points')} • {redemption.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(redemption.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {redemption.status === "under review" && (
                        <Clock className="h-4 w-4 text-orange-500" />
                      )}
                      {redemption.status === "approved" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {redemption.status === "rejected" && (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                      <Badge 
                        variant={
                          redemption.status === "approved" 
                            ? "default" 
                            : redemption.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                        className={
                          redemption.status === "approved" 
                            ? "bg-green-600" 
                            : redemption.status === "rejected"
                            ? "bg-red-600"
                            : "bg-orange-500"
                        }
                      >
                        {redemption.status === "under review" 
                          ? t('redeem.statusUnderReview')
                          : redemption.status === "approved"
                          ? t('redeem.statusApproved') 
                          : redemption.status === "rejected"
                          ? t('redeem.statusRejected')
                          : redemption.status
                        }
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}