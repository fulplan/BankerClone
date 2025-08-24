import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

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
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/">
              <img 
                src="https://www.santanderbank.com/documents/330006/330008/logo+%281%29.png/ca903dab-71ae-9b33-0bab-05c7d754b18f?t=1600208431481&download=true" 
                alt="Santander Bank Logo" 
                className="h-8 cursor-pointer" 
                data-testid="img-logo"
              />
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <a href="#" className="text-gray-700 hover:text-santander-red transition-colors duration-200">Personal</a>
            <a href="#" className="text-gray-700 hover:text-santander-red transition-colors duration-200">Business</a>
            <a href="#" className="text-gray-700 hover:text-santander-red transition-colors duration-200">Commercial</a>
            <a href="#" className="text-gray-700 hover:text-santander-red transition-colors duration-200">Private Client</a>
            <a href="#" className="text-gray-700 hover:text-santander-red transition-colors duration-200">Investing</a>
          </nav>
          
          <div className="flex items-center space-x-4">
            <a href="#" className="text-gray-700 hover:text-santander-red transition-colors duration-200 text-sm">
              Find a Branch/ATM
            </a>
            
            {showLogin && !isAuthenticated && (
              <Button 
                onClick={handleLogin}
                className="bg-santander-red text-white hover:bg-santander-dark"
                data-testid="button-login"
              >
                Login
              </Button>
            )}
            
            {isAuthenticated && user && (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 text-sm">
                  Hello, {user.firstName || 'User'}
                </span>
                <Button 
                  onClick={handleLogout}
                  variant="outline"
                  className="border-santander-red text-santander-red hover:bg-santander-red hover:text-white"
                  data-testid="button-logout"
                >
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
