import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { 
  Send, 
  Receipt, 
  CreditCard, 
  TrendingUp, 
  User, 
  HeadphonesIcon,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  Eye,
  EyeOff,
  Shield,
  QrCode,
  Banknote
} from "lucide-react";
import type { Account, Transaction, Card as BankCard, Notification } from "@shared/schema";

interface CustomerStats {
  totalBalance: string;
  totalAccounts: number;
  totalCards: number;
  recentTransactions: number;
  unreadNotifications: number;
  monthlySpending: string;
}

interface ForexRate {
  currency: string;
  rate: number;
  change: string;
  changePercent: string;
}

interface ForexData {
  base: string;
  timestamp: string;
  rates: ForexRate[];
}

export default function CustomerOverview() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showBalance, setShowBalance] = useState(true);
  const [transactionFilter, setTransactionFilter] = useState('All');

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
    retry: false,
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    retry: false,
  });

  const { data: cards = [], isLoading: cardsLoading } = useQuery<BankCard[]>({
    queryKey: ["/api/cards"],
    retry: false,
  });

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    retry: false,
  });

  const { data: forexData, isLoading: forexLoading } = useQuery<ForexData>({
    queryKey: ["/api/forex-rates"],
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: false,
  });

  // Calculate customer stats
  const customerStats: CustomerStats = {
    totalBalance: accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || '0'), 0).toFixed(2),
    totalAccounts: accounts.length,
    totalCards: cards.length,
    recentTransactions: transactions.filter(t => {
      if (!t.createdAt) return false;
      const transactionDate = new Date(t.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return transactionDate >= weekAgo;
    }).length,
    unreadNotifications: notifications.filter(n => n.status === 'unread').length,
    monthlySpending: transactions
      .filter(t => {
        if (!t.createdAt) return false;
        const transactionDate = new Date(t.createdAt);
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return transactionDate >= monthAgo && t.type === 'debit';
      })
      .reduce((sum, t) => sum + parseFloat(t.amount), 0)
      .toFixed(2),
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Filter transactions based on selected filter
  const filteredTransactions = transactions.filter(transaction => {
    if (transactionFilter === 'Income') return transaction.type === 'credit';
    if (transactionFilter === 'Expense') return transaction.type === 'debit';
    return true; // 'All'
  });

  // Get primary account for balance display
  const primaryAccount = accounts.find(acc => acc.accountType === 'checking') || accounts[0];
  const primaryCard = cards.find(card => card.status === 'active') || cards[0];

  if (accountsLoading || transactionsLoading || cardsLoading || notificationsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile Header with Profile */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-gray-900 font-medium">Hi, {user?.firstName} {user?.lastName}</p>
            <p className="text-gray-500 text-sm">Welcome back!</p>
          </div>
        </div>
        <button 
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set('view', 'notifications');
            window.history.pushState({}, '', url.toString());
            window.location.reload();
          }}
          className="relative p-2 text-gray-600 hover:text-gray-900"
        >
          <Bell className="w-6 h-6" />
          {customerStats.unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {customerStats.unreadNotifications}
            </span>
          )}
        </button>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm mb-1">Balance</p>
              <div className="flex items-center space-x-2">
                <h2 className="text-3xl font-bold">
                  {showBalance ? formatCurrency(customerStats.totalBalance) : '••••••'}
                </h2>
                <button 
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-blue-200 hover:text-white"
                >
                  {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <div className="w-12 h-8 bg-white bg-opacity-20 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">VISA</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-blue-100 text-sm font-mono">
              •••• •••• •••• {primaryCard?.cardNumber?.slice(-4) || primaryAccount?.accountNumber?.slice(-4) || '4312'}
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -ml-10 -mb-10"></div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set('view', 'transfers');
            window.history.pushState({}, '', url.toString());
            window.location.reload();
          }}
          className="flex items-center space-x-3 bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Send className="w-5 h-5 text-blue-600" />
          </div>
          <span className="font-medium text-gray-900">Send Money</span>
        </button>
        
        <button 
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set('view', 'bills');
            window.history.pushState({}, '', url.toString());
            window.location.reload();
          }}
          className="flex items-center space-x-3 bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Receipt className="w-5 h-5 text-green-600" />
          </div>
          <span className="font-medium text-gray-900">Pay Bills</span>
        </button>
        
        <button 
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set('view', 'cards');
            window.history.pushState({}, '', url.toString());
            window.location.reload();
          }}
          className="flex items-center space-x-3 bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-purple-600" />
          </div>
          <span className="font-medium text-gray-900">Cards</span>
        </button>
        
        <button 
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.set('view', 'accounts');
            window.history.pushState({}, '', url.toString());
            window.location.reload();
          }}
          className="flex items-center space-x-3 bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <Banknote className="w-5 h-5 text-orange-600" />
          </div>
          <span className="font-medium text-gray-900">Accounts</span>
        </button>
      </div>

      {/* More Services */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-4">More Services</h3>
        <div className="grid grid-cols-3 gap-4">
          <button 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('view', 'investments');
              window.history.pushState({}, '', url.toString());
              window.location.reload();
            }}
            className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-xs font-medium text-gray-900 text-center">Investments</span>
          </button>
          
          <button 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('view', 'inheritance');
              window.history.pushState({}, '', url.toString());
              window.location.reload();
            }}
            className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mb-2">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs font-medium text-gray-900 text-center">Inheritance</span>
          </button>
          
          <button 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('view', 'support');
              window.history.pushState({}, '', url.toString());
              window.location.reload();
            }}
            className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center mb-2">
              <HeadphonesIcon className="w-5 h-5 text-rose-600" />
            </div>
            <span className="text-xs font-medium text-gray-900 text-center">Support</span>
          </button>
        </div>
        
        {/* Second row of services */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <button 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('view', 'notifications');
              window.history.pushState({}, '', url.toString());
              window.location.reload();
            }}
            className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors relative"
          >
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mb-2 relative">
              <Bell className="w-5 h-5 text-red-600" />
              {customerStats.unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {customerStats.unreadNotifications}
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-gray-900 text-center">Alerts</span>
          </button>
          
          <button 
            className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center mb-2">
              <QrCode className="w-5 h-5 text-teal-600" />
            </div>
            <span className="text-xs font-medium text-gray-900 text-center">QR Pay</span>
          </button>
          
          <button 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('view', 'accounts');
              window.history.pushState({}, '', url.toString());
              window.location.reload();
            }}
            className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center mb-2">
              <Plus className="w-5 h-5 text-cyan-600" />
            </div>
            <span className="text-xs font-medium text-gray-900 text-center">Add Money</span>
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Transaction History</h3>
            <button className="text-blue-600 text-sm font-medium">See all</button>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {['All', 'Income', 'Expense'].map((filter) => (
              <button
                key={filter}
                onClick={() => setTransactionFilter(filter)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  transactionFilter === filter
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4">
          <div className="space-y-4">
            {filteredTransactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.type === 'credit' ? 'bg-green-100' :
                  transaction.type === 'debit' ? 'bg-red-100' :
                  'bg-orange-100'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    transaction.type === 'credit' ? 'bg-green-500' :
                    transaction.type === 'debit' ? 'bg-red-500' :
                    'bg-orange-500'
                  }`}>
                    <span className="text-white text-xs">☕</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{transaction.description}</p>
                  <p className="text-gray-500 text-xs">
                    {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold text-sm ${
                    transaction.type === 'credit' ? 'text-green-600' :
                    transaction.type === 'debit' ? 'text-red-600' :
                    'text-orange-600'
                  }`}>
                    {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>
            ))}
            {filteredTransactions.length === 0 && (
              <p className="text-gray-500 text-center py-8">No transactions found</p>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Quick Actions - Hidden on mobile, shown on larger screens */}
      <div className="hidden sm:block">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              <Button 
                variant="outline" 
                className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 hover:bg-blue-600 hover:text-white transition-colors"
                onClick={() => setLocation("/dashboard?view=transfers")}
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span className="text-xs sm:text-sm">Transfer Money</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 hover:bg-blue-600 hover:text-white transition-colors"
                onClick={() => setLocation("/dashboard?view=bills")}
              >
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span className="text-xs sm:text-sm">Pay Bills</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 hover:bg-blue-600 hover:text-white transition-colors"
                onClick={() => setLocation("/dashboard?view=cards")}
              >
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span className="text-xs sm:text-sm">Manage Cards</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 hover:bg-blue-600 hover:text-white transition-colors"
                onClick={() => setLocation("/dashboard?view=investments")}
              >
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span className="text-xs sm:text-sm">Investments</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 hover:bg-blue-600 hover:text-white transition-colors"
                onClick={() => setLocation("/dashboard?view=profile")}
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span className="text-xs sm:text-sm">Profile</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 sm:h-20 flex-col gap-1 sm:gap-2 hover:bg-blue-600 hover:text-white transition-colors"
                onClick={() => setLocation("/dashboard?view=support")}
              >
                <HeadphonesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span className="text-xs sm:text-sm">Support</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}