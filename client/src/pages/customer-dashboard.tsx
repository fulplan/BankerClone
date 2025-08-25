import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/ui/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomerOverview from "@/components/customer/customer-overview";
import AccountOverview from "@/components/customer/account-overview";
import CardManagement from "@/components/customer/card-management";
import TransferCenter from "@/components/customer/transfer-center";
import BillPayments from "@/components/customer/bill-payments";
import InvestmentDashboard from "@/components/customer/investment-dashboard";
import CustomerProfile from "@/components/customer/customer-profile";
import CustomerSupport from "@/components/customer/customer-support";
import NotificationsCenter from "@/components/notifications/notifications-center";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function CustomerDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Add small delay to prevent race condition with fresh logins
    const timeoutId = setTimeout(() => {
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
      
      if (!isLoading && user && user.role === 'admin') {
        window.location.href = "/admin";
        return;
      }
    }, 150);

    return () => clearTimeout(timeoutId);
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showLogin={false} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-customer-title">Welcome to Finora Bank</h1>
          <p className="text-gray-600">
            Hello, {user.firstName} {user.lastName}
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-9">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="accounts" data-testid="tab-accounts">Accounts</TabsTrigger>
            <TabsTrigger value="cards" data-testid="tab-cards">Cards</TabsTrigger>
            <TabsTrigger value="transfers" data-testid="tab-transfers">Transfers</TabsTrigger>
            <TabsTrigger value="bills" data-testid="tab-bills">Bill Pay</TabsTrigger>
            <TabsTrigger value="investments" data-testid="tab-investments">Investments</TabsTrigger>
            <TabsTrigger value="notifications" data-testid="tab-notifications">Notifications</TabsTrigger>
            <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
            <TabsTrigger value="support" data-testid="tab-support">Support</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <CustomerOverview />
          </TabsContent>
          
          <TabsContent value="accounts">
            <AccountOverview />
          </TabsContent>
          
          <TabsContent value="cards">
            <CardManagement />
          </TabsContent>
          
          <TabsContent value="transfers">
            <TransferCenter />
          </TabsContent>
          
          <TabsContent value="bills">
            <BillPayments />
          </TabsContent>
          
          <TabsContent value="investments">
            <InvestmentDashboard />
          </TabsContent>
          
          <TabsContent value="notifications">
            <NotificationsCenter />
          </TabsContent>
          
          <TabsContent value="profile">
            <CustomerProfile />
          </TabsContent>
          
          <TabsContent value="support">
            <CustomerSupport />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
