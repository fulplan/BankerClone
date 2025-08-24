import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/ui/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AccountOverview from "@/components/customer/account-overview";
import TransactionHistory from "@/components/customer/transaction-history";
import TransferForm from "@/components/customer/transfer-form";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function CustomerDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
    
    if (!isLoading && user && user.role === 'admin') {
      window.location.href = "/admin";
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-santander-red mx-auto"></div>
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
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-customer-title">Welcome to Santander Bank</h1>
          <p className="text-gray-600">
            Hello, {user.firstName} {user.lastName}
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" data-testid="tab-overview">Account Overview</TabsTrigger>
            <TabsTrigger value="transactions" data-testid="tab-transactions">Transaction History</TabsTrigger>
            <TabsTrigger value="transfer" data-testid="tab-transfer">Transfer Money</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <AccountOverview />
          </TabsContent>
          
          <TabsContent value="transactions">
            <TransactionHistory />
          </TabsContent>
          
          <TabsContent value="transfer">
            <TransferForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
