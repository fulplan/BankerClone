import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  Home, 
  CreditCard, 
  Send, 
  Bell, 
  User, 
  HeadphonesIcon,
  TrendingUp,
  Receipt,
  Building2,
  FileText
} from "lucide-react";

export default function CustomerNavbar() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

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
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center text-finora-primary hover:text-finora-dark transition-colors duration-200">
              <Building2 className="w-6 h-6 mr-2" />
              <span className="font-bold text-lg">Global Deposit Protection</span>
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className="text-gray-700 hover:text-finora-primary transition-colors duration-200 text-sm font-medium flex items-center gap-1">
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="/transfer" className="text-gray-700 hover:text-finora-primary transition-colors duration-200 text-sm font-medium flex items-center gap-1">
              <Send className="w-4 h-4" />
              Transfer
            </Link>
            <Link href="/dashboard?tab=cards" className="text-gray-700 hover:text-finora-primary transition-colors duration-200 text-sm font-medium flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              Cards
            </Link>
            <Link href="/dashboard?tab=investments" className="text-gray-700 hover:text-finora-primary transition-colors duration-200 text-sm font-medium flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Investments
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 text-sm">
              Welcome, {user?.firstName || 'User'}
            </span>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="border-finora-primary text-finora-primary hover:bg-finora-primary hover:text-white"
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}