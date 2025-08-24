import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
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
  const [currentTime, setCurrentTime] = useState(new Date());

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

  if (accountsLoading || transactionsLoading || cardsLoading || notificationsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finora-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600">{formatTime(currentTime)}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(customerStats.totalBalance)}</p>
              <p className="text-sm text-gray-600">Total Balance</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{customerStats.totalAccounts}</p>
              <p className="text-sm text-gray-600">Active Accounts</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{customerStats.totalCards}</p>
              <p className="text-sm text-gray-600">Active Cards</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{customerStats.recentTransactions}</p>
              <p className="text-sm text-gray-600">Recent Transactions</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{customerStats.unreadNotifications}</p>
              <p className="text-sm text-gray-600">Unread Notifications</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{formatCurrency(customerStats.monthlySpending)}</p>
              <p className="text-sm text-gray-600">Monthly Spending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-university text-finora-primary"></i>
              Account Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accounts.slice(0, 3).map((account) => (
                <div key={account.id} className="flex justify-between items-center p-3 border rounded">
                  <div>
                    <p className="font-medium">{account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} Account</p>
                    <p className="text-sm text-gray-600">****{account.accountNumber.slice(-4)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(account.balance)}</p>
                    <Badge variant={account.status === 'active' ? 'default' : 'destructive'}>
                      {account.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {accounts.length > 3 && (
                <Button variant="outline" className="w-full">
                  View All Accounts ({accounts.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Real-Time Forex Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-chart-line text-finora-primary"></i>
              Live Forex Rates
              <Badge variant="outline" className="ml-auto">
                USD Base
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {forexLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-finora-primary"></div>
              </div>
            ) : forexData ? (
              <div className="space-y-2">
                {forexData.rates.slice(0, 6).map((rate) => (
                  <div key={rate.currency} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rate.currency}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono">{rate.rate.toFixed(4)}</span>
                      <Badge
                        variant={parseFloat(rate.change) >= 0 ? "default" : "destructive"}
                        className="ml-2 text-xs"
                      >
                        {parseFloat(rate.change) >= 0 ? "+" : ""}{rate.changePercent}%
                      </Badge>
                    </div>
                  </div>
                ))}
                <div className="text-xs text-gray-500 text-center pt-2">
                  Last updated: {forexData.timestamp ? new Date(forexData.timestamp).toLocaleTimeString() : 'N/A'}
                </div>
              </div>
            ) : (
              <Alert>
                <AlertDescription>Unable to load forex rates</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-exchange-alt text-finora-primary"></i>
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex justify-between items-center p-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'credit' ? 'bg-green-100 text-green-600' :
                      transaction.type === 'debit' ? 'bg-red-100 text-red-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      <i className={`fas ${
                        transaction.type === 'credit' ? 'fa-arrow-down' :
                        transaction.type === 'debit' ? 'fa-arrow-up' :
                        'fa-receipt'
                      } text-sm`}></i>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'credit' ? 'text-green-600' :
                      transaction.type === 'debit' ? 'text-red-600' :
                      'text-orange-600'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-gray-500 text-center py-4">No recent transactions</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <i className="fas fa-bell text-finora-primary"></i>
              Recent Notifications
              {customerStats.unreadNotifications > 0 && (
                <Badge className="bg-red-500 text-white">
                  {customerStats.unreadNotifications}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.slice(0, 4).map((notification) => (
                <div key={notification.id} className={`p-3 border rounded ${
                  notification.status === 'unread' ? 'bg-blue-50 border-blue-200' : ''
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                    </div>
                    <Badge variant={
                      notification.type === 'fraud_alert' ? 'destructive' :
                      notification.type === 'security' ? 'secondary' :
                      'default'
                    } className="text-xs">
                      {notification.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-gray-500 text-center py-4">No notifications</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <i className="fas fa-exchange-alt text-finora-primary"></i>
              <span className="text-sm">Transfer Money</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <i className="fas fa-file-invoice text-finora-primary"></i>
              <span className="text-sm">Pay Bills</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <i className="fas fa-credit-card text-finora-primary"></i>
              <span className="text-sm">Manage Cards</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <i className="fas fa-chart-pie text-finora-primary"></i>
              <span className="text-sm">Investments</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <i className="fas fa-user-cog text-finora-primary"></i>
              <span className="text-sm">Profile</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <i className="fas fa-headset text-finora-primary"></i>
              <span className="text-sm">Support</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}