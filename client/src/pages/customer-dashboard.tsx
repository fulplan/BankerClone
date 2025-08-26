import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import CustomerNavbar from "@/components/ui/customer-navbar";
import CustomerOverview from "@/components/customer/customer-overview";
import AccountOverview from "@/components/customer/account-overview";
import CardManagement from "@/components/customer/card-management";
import TransferCenter from "@/components/customer/transfer-center";
import BillPayments from "@/components/customer/bill-payments";
import InvestmentDashboard from "@/components/customer/investment-dashboard";
import CustomerProfile from "@/components/customer/customer-profile";
import CustomerSupport from "@/components/customer/customer-support";
import NotificationsCenter from "@/components/notifications/notifications-center";
import InheritanceManagement from "@/components/customer/inheritance-management";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Home, Wallet, BarChart3, User, Send, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function CustomerDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  
  // Get active view from URL query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const activeViewFromUrl = urlParams.get('view') || 'home';
  const [activeView, setActiveView] = useState(activeViewFromUrl);

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

  const handleViewChange = (view: string) => {
    setActiveView(view);
    const url = new URL(window.location.href);
    url.searchParams.set('view', view);
    window.history.pushState({}, '', url.toString());
  };

  const renderActiveView = () => {
    switch(activeView) {
      case 'accounts':
        return <AccountOverview />;
      case 'cards':
        return <CardManagement />;
      case 'transfers':
        return <TransferCenter />;
      case 'bills':
        return <BillPayments />;
      case 'investments':
        return <InvestmentDashboard />;
      case 'inheritance':
        return <InheritanceManagement />;
      case 'notifications':
        return <NotificationsCenter />;
      case 'profile':
        return <CustomerProfile />;
      case 'support':
        return <CustomerSupport />;
      case 'home':
      default:
        return <CustomerOverview />;
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <CustomerNavbar />
      
      <div className="max-w-md mx-auto px-4 py-6 sm:max-w-7xl sm:px-6 lg:px-8">
        {renderActiveView()}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => handleViewChange('home')}
            className={`flex flex-col items-center p-1.5 rounded-lg transition-colors ${
              activeView === 'home' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </button>
          
          <button
            onClick={() => handleViewChange('accounts')}
            className={`flex flex-col items-center p-1.5 rounded-lg transition-colors ${
              activeView === 'accounts' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <Wallet className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Wallet</span>
          </button>
          
          <button
            onClick={() => handleViewChange('transfers')}
            className={`flex flex-col items-center p-1.5 rounded-lg transition-colors ${
              activeView === 'transfers' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <Send className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Transfer</span>
          </button>
          
          <button
            onClick={() => handleViewChange('investments')}
            className={`flex flex-col items-center p-1.5 rounded-lg transition-colors ${
              activeView === 'investments' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Report</span>
          </button>
          
          <button
            onClick={() => handleViewChange('profile')}
            className={`flex flex-col items-center p-1.5 rounded-lg transition-colors ${
              activeView === 'profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            }`}
          >
            <User className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Account</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
