import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  Shield, 
  Users, 
  Activity, 
  Settings, 
  FileText,
  Building2,
  Bell,
  BarChart3
} from "lucide-react";

export default function AdminNavbar() {
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
            <Link href="/admin" className="flex items-center text-finora-primary hover:text-finora-dark transition-colors duration-200">
              <Building2 className="w-6 h-6 mr-2" />
              <span className="font-bold text-lg">Global Deposit Protection</span>
              <Shield className="w-5 h-5 ml-2 text-amber-600" />
            </Link>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/admin" className="text-gray-700 hover:text-finora-primary transition-colors duration-200 text-sm font-medium flex items-center gap-1">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </Link>
            <Link href="/admin/users" className="text-gray-700 hover:text-finora-primary transition-colors duration-200 text-sm font-medium flex items-center gap-1">
              <Users className="w-4 h-4" />
              Users
            </Link>
            <Link href="/admin?tab=transfers" className="text-gray-700 hover:text-finora-primary transition-colors duration-200 text-sm font-medium flex items-center gap-1">
              <Activity className="w-4 h-4" />
              Transfers
            </Link>
            <Link href="/admin?tab=support" className="text-gray-700 hover:text-finora-primary transition-colors duration-200 text-sm font-medium flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Support
            </Link>
          </nav>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-700 text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600" />
              Admin: {user?.firstName || 'User'}
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