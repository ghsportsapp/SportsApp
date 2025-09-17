import { Navbar } from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Users, BarChart3, FileText, Shield, Gift, Target, Trophy } from "lucide-react";
import { memo, useCallback } from "react";

// Memoized admin card component for better performance
const AdminCard = memo(({ title, description, icon: Icon, color, onClick, disabled = false }: any) => (
  <Card 
    className={`shadow-sm border border-gray-200 transition-shadow cursor-pointer ${
      disabled 
        ? 'opacity-50 cursor-not-allowed' 
        : 'hover:shadow-md'
    }`}
    onClick={disabled ? undefined : onClick}
  >
    <CardContent className="p-6">
      <div className="flex items-center mb-4">
        <div className={`h-12 w-12 ${disabled ? 'bg-gray-400' : color} rounded-lg flex items-center justify-center`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="ml-4">
          <h3 className={`text-lg font-semibold ${disabled ? 'text-gray-500' : 'text-gray-900'}`}>{title}</h3>
          <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>{description}</p>
        </div>
      </div>
      <div className={`text-2xl font-bold mb-2 ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>---</div>
      <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
        {disabled ? 'Coming soon' : 'Management panel'}
      </p>
    </CardContent>
  </Card>
));

function AdminPage() {
  const [, setLocation] = useLocation();
  
  // Memoized navigation handlers
  const handleNavigate = useCallback((path: string) => {
    setLocation(path);
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Admin Dashboard Content */}
      <main className="main-content max-w-7xl mx-auto pt-20 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your SportsApp platform</p>
        </div>

        {/* Admin Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* User Management Card */}
          <AdminCard
            title="User Management"
            description="Manage registered users"
            icon={Users}
            color="bg-blue-600"
            onClick={() => handleNavigate("/user-management")}
          />

          {/* Analytics Card */}
          <AdminCard
            title="Analytics"
            description="Coming soon"
            icon={BarChart3}
            color="bg-gray-400"
            disabled={true}
          />

          {/* Post Management Card */}
          <Card 
            className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLocation("/post-management")}
          >
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Post Management</h3>
                  <p className="text-sm text-gray-600">Manage posts & reports</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-2">---</div>
              <p className="text-sm text-gray-500">Handle posts and reports</p>
            </CardContent>
          </Card>

          {/* Verification Management Card */}
          <Card 
            className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLocation("/verification-management")}
          >
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Verification Management</h3>
                  <p className="text-sm text-gray-600">Review verification requests</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-600 mb-2">---</div>
              <p className="text-sm text-gray-500">Pending verifications</p>
            </CardContent>
          </Card>

          {/* Redeem Management Card */}
          <Card 
            className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLocation("/redeem-management")}
          >
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-orange-600 rounded-lg flex items-center justify-center">
                  <Gift className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Redeem Management</h3>
                  <p className="text-sm text-gray-600">Approve voucher requests</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-orange-600 mb-2">---</div>
              <p className="text-sm text-gray-500">Pending redemptions</p>
            </CardContent>
          </Card>

          {/* Drill Management Card */}
          <Card 
            className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLocation("/drill-management")}
          >
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Drill Management</h3>
                  <p className="text-sm text-gray-600">Review uploaded drills</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-indigo-600 mb-2">---</div>
              <p className="text-sm text-gray-500">Pending drill reviews</p>
            </CardContent>
          </Card>

          {/* Tryout Management Card */}
          <Card 
            className="shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setLocation("/tryout-management")}
          >
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Tryout Management</h3>
                  <p className="text-sm text-gray-600">Manage tryouts & applications</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-2">---</div>
              <p className="text-sm text-gray-500">Active tryouts</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default AdminPage;
