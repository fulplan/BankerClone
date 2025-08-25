import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
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
  FileText,
  Menu,
  X
} from "lucide-react";

export default function CustomerNavbar() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard" className="flex items-center text-finora-primary hover:text-finora-dark transition-colors duration-200">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 mr-1 sm:mr-2" />
              <span className="font-bold text-sm sm:text-base lg:text-lg hidden xs:block">Global Deposit Protection</span>
              <span className="font-bold text-sm xs:hidden">GDP</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
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
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-finora-primary hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <span className="text-gray-700 text-xs sm:text-sm hidden sm:block">
              Welcome, {user?.firstName || 'User'}
            </span>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="border-finora-primary text-finora-primary hover:bg-finora-primary hover:text-white text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
              <Link 
                href="/dashboard" 
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-finora-primary hover:bg-gray-50 rounded-md flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Link>
              <Link 
                href="/transfer" 
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-finora-primary hover:bg-gray-50 rounded-md flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Send className="w-4 h-4" />
                Transfer
              </Link>
              <Link 
                href="/dashboard?tab=cards" 
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-finora-primary hover:bg-gray-50 rounded-md flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <CreditCard className="w-4 h-4" />
                Cards
              </Link>
              <Link 
                href="/dashboard?tab=investments" 
                className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-finora-primary hover:bg-gray-50 rounded-md flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <TrendingUp className="w-4 h-4" />
                Investments
              </Link>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="px-3 py-2 text-sm text-gray-600">
                  Welcome, {user?.firstName || 'User'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}