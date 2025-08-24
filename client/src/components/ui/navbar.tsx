import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Home, Search, User, Lock, X } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  showLogin: boolean;
}

export default function Navbar({ showLogin }: NavbarProps) {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
    setLocation("/login");
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setLocation(`/products?search=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  const handleOpenAccount = () => {
    setShowAccountForm(true);
  };

  const handleAccountFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation("/dashboard");
    setShowAccountForm(false);
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
            <button 
              onClick={() => setShowSearch(true)}
              className="text-gray-600 hover:text-finora-primary transition-colors duration-200"
            >
              <Search className="w-5 h-5" />
            </button>
          </nav>
          
          <div className="flex items-center space-x-3">
            {showLogin && !isAuthenticated && (
              <>
                <Button 
                  variant="outline"
                  onClick={handleOpenAccount}
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

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Search Banking Products & Services</h3>
              <button onClick={() => setShowSearch(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, services, help topics..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-finora-primary"
                autoFocus
              />
              <div className="flex gap-2 mt-4">
                <Button type="submit" className="flex-1 bg-finora-primary hover:bg-finora-dark">
                  Search
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowSearch(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Opening Modal */}
      {showAccountForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Open Your Finora Account</h3>
              <button onClick={() => setShowAccountForm(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAccountFormSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                  <select className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-finora-primary">
                    <option>Personal Checking</option>
                    <option>Personal Savings</option>
                    <option>Business Checking</option>
                    <option>Business Savings</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" required className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-finora-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" required className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-finora-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" required className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-finora-primary" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button type="submit" className="flex-1 bg-finora-primary hover:bg-finora-dark">
                  Continue Application
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAccountForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
