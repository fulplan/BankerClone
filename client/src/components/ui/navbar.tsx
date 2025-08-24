import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Home, Search, User, Lock } from "lucide-react";

interface NavbarProps {
  showLogin: boolean;
}

export default function Navbar({ showLogin }: NavbarProps) {
  const { user, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/";
    }
  };

  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-3">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center text-gray-600 hover:text-finora-primary transition-colors duration-200">
              <Home className="w-5 h-5" />
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/products" className="text-gray-700 hover:text-finora-primary transition-colors duration-200 text-sm font-medium">Products</Link>
            <Link href="/promotions" className="text-gray-700 hover:text-finora-primary transition-colors duration-200 text-sm font-medium">Promotions</Link>
            <Link href="/services" className="text-gray-700 hover:text-finora-primary transition-colors duration-200 text-sm font-medium">Services</Link>
            <Link href="/help" className="text-gray-700 hover:text-finora-primary transition-colors duration-200 text-sm font-medium">Help</Link>
            <button className="text-gray-600 hover:text-finora-primary transition-colors duration-200">
              <Search className="w-5 h-5" />
            </button>
          </nav>
          
          <div className="flex items-center space-x-3">
            {showLogin && !isAuthenticated && (
              <>
                <Button 
                  variant="outline"
                  className="border-finora-primary text-finora-primary hover:bg-finora-primary hover:text-white text-xs font-medium px-4 py-2 flex items-center gap-2"
                  data-testid="button-open-account"
                >
                  <User className="w-4 h-4" />
                  OPEN AN ACCOUNT
                </Button>
                <Button 
                  onClick={handleLogin}
                  className="bg-green-700 text-white hover:bg-green-800 text-xs font-medium px-6 py-2 flex items-center gap-2"
                  data-testid="button-login"
                >
                  <Lock className="w-4 h-4" />
                  LOGIN
                </Button>
              </>
            )}
            
            {isAuthenticated && user && (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 text-sm">
                  Hello, {user.firstName || 'User'}
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
            )}
            
            <Link href="/" className="flex items-center ml-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-finora-primary to-finora-secondary rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="text-2xl font-bold text-finora-primary" data-testid="text-logo">Finora</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
