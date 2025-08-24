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
                src="/@assets/generated_images/Finora_banking_logo_bd4863b1.png" 
                alt="Finora Bank Logo" 
                className="h-8 cursor-pointer" 
                data-testid="img-logo"
              />
            </Link>
          </div>
          
          <nav className="hidden md:flex space-x-8">
            <Link href="/personal" className="text-gray-700 hover:text-finora-primary transition-colors duration-200">Personal</Link>
            <Link href="/business" className="text-gray-700 hover:text-finora-primary transition-colors duration-200">Business</Link>
            <Link href="/commercial" className="text-gray-700 hover:text-finora-primary transition-colors duration-200">Commercial</Link>
            <Link href="/private-client" className="text-gray-700 hover:text-finora-primary transition-colors duration-200">Private Client</Link>
            <Link href="/investing" className="text-gray-700 hover:text-finora-primary transition-colors duration-200">Investing</Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <Link href="/find-branch" className="text-gray-700 hover:text-finora-primary transition-colors duration-200 text-sm">
              Find a Branch/ATM
            </Link>
            
            {showLogin && !isAuthenticated && (
              <Button 
                onClick={handleLogin}
                className="bg-finora-primary text-white hover:bg-finora-dark"
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
                  className="border-finora-primary text-finora-primary hover:bg-finora-primary hover:text-white"
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
