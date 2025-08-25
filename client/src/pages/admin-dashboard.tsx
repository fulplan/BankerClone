import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import AdminNavbar from "@/components/ui/admin-navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AccountManagement from "@/components/admin/account-management";
import TransferApproval from "@/components/admin/transfer-approval";
import AdminSupportTickets from "@/components/admin/admin-support-tickets";
import AuditLog from "@/components/admin/audit-log";
import InheritanceManagement from "@/components/admin/inheritance-management";
import NotificationManagement from "@/components/admin/notification-management";
import EmailConfiguration from "@/components/admin/email-configuration";
import UserManagement from "@/pages/user-management";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Users, DollarSign, Activity, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function AdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Fetch real-time system statistics
  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: false,
  });

  // Fetch forex rates for additional dashboard info
  const { data: forexRates } = useQuery<any>({
    queryKey: ["/api/forex-rates"],
    refetchInterval: 60000, // Refresh every minute
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
    
    if (!isLoading && user && user.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-finora-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-admin-title">Admin Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {user.firstName} {user.lastName}
          </p>
        </div>

        {/* Real-time Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900" data-testid="text-total-users">
                {statsLoading ? "Loading..." : stats?.users?.total || "0"}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {stats?.users?.newToday || 0} new today • {stats?.users?.activeNow || 0} online
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">Active Accounts</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900" data-testid="text-active-accounts">
                {statsLoading ? "Loading..." : stats?.accounts?.active || "0"}
              </div>
              <p className="text-xs text-green-600 mt-1">
                {stats?.accounts?.frozen || 0} frozen • {stats?.accounts?.closed || 0} closed
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-700">Pending Transfers</CardTitle>
              <Clock className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900" data-testid="text-pending-transfers">
                {statsLoading ? "Loading..." : stats?.transfers?.pending || "0"}
              </div>
              <p className="text-xs text-red-600 mt-1">
                {stats?.transfers?.completed || 0} completed • {stats?.transfers?.rejected || 0} rejected
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900" data-testid="text-total-balance">
                {statsLoading ? "Loading..." : `$${(stats?.accounts?.totalBalance || 0).toLocaleString()}`}
              </div>
              <p className="text-xs text-purple-600 mt-1">
                Monthly Volume: ${(stats?.transactions?.monthlyVolume || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Forex Rates Display */}
        {forexRates && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Live Exchange Rates (USD Base)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {forexRates.rates?.slice(0, 10).map((rate: any) => (
                  <div key={rate.currency} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="font-semibold text-gray-900">{rate.currency}</div>
                    <div className="text-lg font-bold">{rate.rate}</div>
                    <div className={`text-sm ${
                      parseFloat(rate.changePercent) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {parseFloat(rate.changePercent) >= 0 ? '+' : ''}{rate.changePercent}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="accounts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="accounts" data-testid="tab-accounts">Account Management</TabsTrigger>
            <TabsTrigger value="transfers" data-testid="tab-transfers">Transfer Approval</TabsTrigger>
            <TabsTrigger value="inheritance" data-testid="tab-inheritance">Inheritance Management</TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
            <TabsTrigger value="email" data-testid="tab-email">Email Configuration</TabsTrigger>
            <TabsTrigger value="support" data-testid="tab-support">Support Tickets</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">User Management</TabsTrigger>
            <TabsTrigger value="audit" data-testid="tab-audit">Audit Log</TabsTrigger>
          </TabsList>
          
          <TabsContent value="accounts">
            <AccountManagement />
          </TabsContent>
          
          <TabsContent value="transfers">
            <TransferApproval />
          </TabsContent>
          
          <TabsContent value="inheritance">
            <InheritanceManagement />
          </TabsContent>
          
          <TabsContent value="notifications">
            <NotificationManagement />
          </TabsContent>
          
          <TabsContent value="email">
            <EmailConfiguration />
          </TabsContent>
          
          <TabsContent value="support">
            <AdminSupportTickets />
          </TabsContent>
          
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="audit">
            <AuditLog />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
