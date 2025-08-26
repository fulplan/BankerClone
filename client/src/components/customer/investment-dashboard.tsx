import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Account, Investment, SavingsGoal } from "@shared/schema";

interface InvestmentForm {
  accountId: string;
  type: 'stocks' | 'mutual_funds' | 'savings_plan' | 'forex';
  instrumentName: string;
  amount: string;
}

interface SavingsGoalForm {
  accountId: string;
  name: string;
  targetAmount: string;
  targetDate: string;
  autoDeposit: boolean;
  depositAmount: string;
  depositFrequency: 'weekly' | 'monthly';
}

const investmentTypes = [
  { value: 'stocks', label: 'Individual Stocks', icon: 'fas fa-chart-line', color: 'bg-blue-100 text-blue-800' },
  { value: 'mutual_funds', label: 'Mutual Funds', icon: 'fas fa-chart-pie', color: 'bg-green-100 text-green-800' },
  { value: 'savings_plan', label: 'Savings Plan', icon: 'fas fa-piggy-bank', color: 'bg-purple-100 text-purple-800' },
  { value: 'forex', label: 'Forex Trading', icon: 'fas fa-exchange-alt', color: 'bg-orange-100 text-orange-800' },
];

const mockStocks = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: '+1.2%' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2734.56, change: '+0.8%' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: 334.89, change: '+2.1%' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3342.88, change: '-0.5%' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 792.12, change: '+3.4%' },
];

const mockMutualFunds = [
  { name: 'Vanguard S&P 500 ETF', symbol: 'VOO', price: 412.78, change: '+1.1%' },
  { name: 'Growth Fund of America', symbol: 'AGTHX', price: 58.34, change: '+0.9%' },
  { name: 'Fidelity Contrafund', symbol: 'FCNTX', price: 18.45, change: '+1.5%' },
];

export default function InvestmentDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isInvestDialogOpen, setIsInvestDialogOpen] = useState(false);
  const [isSavingsGoalDialogOpen, setIsSavingsGoalDialogOpen] = useState(false);
  const [investmentForm, setInvestmentForm] = useState<InvestmentForm>({
    accountId: '',
    type: 'stocks',
    instrumentName: '',
    amount: '',
  });
  const [savingsGoalForm, setSavingsGoalForm] = useState<SavingsGoalForm>({
    accountId: '',
    name: '',
    targetAmount: '',
    targetDate: '',
    autoDeposit: false,
    depositAmount: '',
    depositFrequency: 'monthly',
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
    retry: false,
  });

  const { data: investments = [], isLoading: investmentsLoading } = useQuery<Investment[]>({
    queryKey: ["/api/investments"],
    retry: false,
  });

  const { data: savingsGoals = [], isLoading: savingsGoalsLoading } = useQuery<SavingsGoal[]>({
    queryKey: ["/api/savings-goals"],
    retry: false,
  });

  const { data: forexData, isLoading: forexLoading } = useQuery({
    queryKey: ["/api/forex-rates"],
    refetchInterval: 30000,
    retry: false,
  });

  const createInvestmentMutation = useMutation({
    mutationFn: async (data: InvestmentForm) => {
      const response = await apiRequest("POST", "/api/investments", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Investment created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/investments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsInvestDialogOpen(false);
      setInvestmentForm({
        accountId: '',
        type: 'stocks',
        instrumentName: '',
        amount: '',
      });
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => window.location.href = "/api/login", 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create investment",
        variant: "destructive",
      });
    },
  });

  const createSavingsGoalMutation = useMutation({
    mutationFn: async (data: SavingsGoalForm) => {
      const response = await apiRequest("POST", "/api/savings-goals", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Savings goal created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/savings-goals"] });
      setIsSavingsGoalDialogOpen(false);
      setSavingsGoalForm({
        accountId: '',
        name: '',
        targetAmount: '',
        targetDate: '',
        autoDeposit: false,
        depositAmount: '',
        depositFrequency: 'monthly',
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create savings goal",
        variant: "destructive",
      });
    },
  });

  const handleCreateInvestment = () => {
    if (!investmentForm.accountId || !investmentForm.instrumentName || !investmentForm.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createInvestmentMutation.mutate(investmentForm);
  };

  const handleCreateSavingsGoal = () => {
    if (!savingsGoalForm.accountId || !savingsGoalForm.name || !savingsGoalForm.targetAmount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createSavingsGoalMutation.mutate(savingsGoalForm);
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const calculateProgress = (current: string, target: string) => {
    const currentAmount = parseFloat(current);
    const targetAmount = parseFloat(target);
    return Math.min((currentAmount / targetAmount) * 100, 100);
  };

  const getInvestmentTypeInfo = (type: string) => {
    return investmentTypes.find(t => t.value === type) || investmentTypes[0];
  };

  if (accountsLoading || investmentsLoading || savingsGoalsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finora-primary"></div>
      </div>
    );
  }

  const totalPortfolioValue = investments.reduce((sum, inv) => sum + parseFloat(inv.totalValue), 0);
  const totalProfitLoss = investments.reduce((sum, inv) => sum + parseFloat(inv.profitLoss), 0);
  const totalSavingsGoals = savingsGoals.reduce((sum, goal) => sum + parseFloat(goal.currentAmount), 0);
  const totalSavingsTarget = savingsGoals.reduce((sum, goal) => sum + parseFloat(goal.targetAmount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold text-gray-900">Investment Dashboard</h2>
          <p className="text-gray-600 text-sm sm:text-base">Manage your investments, savings goals, and forex trading</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isSavingsGoalDialogOpen} onOpenChange={setIsSavingsGoalDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-finora-primary text-finora-primary hover:bg-finora-primary hover:text-white">
                <i className="fas fa-target mr-2"></i>
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Savings Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="goalAccount">Account</Label>
                  <Select value={savingsGoalForm.accountId} onValueChange={(value) => 
                    setSavingsGoalForm(prev => ({ ...prev, accountId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountType} - ****{account.accountNumber.slice(-4)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="goalName">Goal Name</Label>
                  <Input
                    id="goalName"
                    value={savingsGoalForm.name}
                    onChange={(e) => setSavingsGoalForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Emergency Fund, Vacation, Down Payment"
                  />
                </div>

                <div>
                  <Label htmlFor="targetAmount">Target Amount ($)</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    step="0.01"
                    value={savingsGoalForm.targetAmount}
                    onChange={(e) => setSavingsGoalForm(prev => ({ ...prev, targetAmount: e.target.value }))}
                    placeholder="10000.00"
                  />
                </div>

                <div>
                  <Label htmlFor="targetDate">Target Date (Optional)</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={savingsGoalForm.targetDate}
                    onChange={(e) => setSavingsGoalForm(prev => ({ ...prev, targetDate: e.target.value }))}
                  />
                </div>

                <Button 
                  onClick={handleCreateSavingsGoal} 
                  className="w-full bg-finora-primary hover:bg-finora-primary/90"
                  disabled={createSavingsGoalMutation.isPending}
                >
                  {createSavingsGoalMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <i className="fas fa-target mr-2"></i>
                  )}
                  Create Goal
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isInvestDialogOpen} onOpenChange={setIsInvestDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-finora-primary hover:bg-finora-primary/90">
                <i className="fas fa-plus mr-2"></i>
                New Investment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Investment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="investAccount">Account</Label>
                  <Select value={investmentForm.accountId} onValueChange={(value) => 
                    setInvestmentForm(prev => ({ ...prev, accountId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountType} - ****{account.accountNumber.slice(-4)} - {formatCurrency(account.balance)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="investmentType">Investment Type</Label>
                  <Select value={investmentForm.type} onValueChange={(value: any) => 
                    setInvestmentForm(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {investmentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <i className={type.icon}></i>
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="instrumentName">
                    {investmentForm.type === 'stocks' ? 'Stock Symbol' :
                     investmentForm.type === 'mutual_funds' ? 'Fund Name' :
                     investmentForm.type === 'forex' ? 'Currency Pair' : 'Investment Name'}
                  </Label>
                  <Input
                    id="instrumentName"
                    value={investmentForm.instrumentName}
                    onChange={(e) => setInvestmentForm(prev => ({ ...prev, instrumentName: e.target.value }))}
                    placeholder={
                      investmentForm.type === 'stocks' ? 'e.g., AAPL, GOOGL' :
                      investmentForm.type === 'mutual_funds' ? 'e.g., Vanguard S&P 500' :
                      investmentForm.type === 'forex' ? 'e.g., EUR/USD' : 'Investment name'
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="investAmount">Investment Amount ($)</Label>
                  <Input
                    id="investAmount"
                    type="number"
                    step="0.01"
                    value={investmentForm.amount}
                    onChange={(e) => setInvestmentForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="1000.00"
                  />
                </div>

                <Button 
                  onClick={handleCreateInvestment} 
                  className="w-full bg-finora-primary hover:bg-finora-primary/90"
                  disabled={createInvestmentMutation.isPending}
                >
                  {createInvestmentMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <i className="fas fa-chart-line mr-2"></i>
                  )}
                  Create Investment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
              <i className="fas fa-chart-pie text-blue-600"></i>
            </div>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalPortfolioValue)}</p>
            <p className="text-sm text-gray-600">Portfolio Value</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full mx-auto mb-2 ${
              totalProfitLoss >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <i className={`fas ${totalProfitLoss >= 0 ? 'fa-arrow-up text-green-600' : 'fa-arrow-down text-red-600'}`}></i>
            </div>
            <p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(totalProfitLoss)}
            </p>
            <p className="text-sm text-gray-600">Total P&L</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
              <i className="fas fa-piggy-bank text-purple-600"></i>
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalSavingsGoals)}</p>
            <p className="text-sm text-gray-600">Savings Goals</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
              <i className="fas fa-bullseye text-orange-600"></i>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {totalSavingsTarget > 0 ? `${((totalSavingsGoals / totalSavingsTarget) * 100).toFixed(1)}%` : '0%'}
            </p>
            <p className="text-sm text-gray-600">Goals Progress</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="portfolio" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="portfolio">Portfolio ({investments.length})</TabsTrigger>
          <TabsTrigger value="goals">Savings Goals ({savingsGoals.length})</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="forex">Forex</TabsTrigger>
          <TabsTrigger value="funds">Funds</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio">
          <Card>
            <CardHeader>
              <CardTitle>Investment Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {investments.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-chart-line text-gray-400 text-6xl mb-4"></i>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Start Your Investment Journey</h3>
                    <p className="text-gray-600 mb-6">Create your first investment to begin building wealth for your future.</p>
                    <Button onClick={() => setIsInvestDialogOpen(true)} className="bg-finora-primary hover:bg-finora-primary/90">
                      Make First Investment
                    </Button>
                  </div>
                ) : (
                  investments.map((investment) => {
                    const typeInfo = getInvestmentTypeInfo(investment.type);
                    const profitLossPercent = ((parseFloat(investment.profitLoss) / (parseFloat(investment.totalValue) - parseFloat(investment.profitLoss))) * 100);
                    
                    return (
                      <div key={investment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${typeInfo.color.replace('text-', 'text-').replace('bg-', 'bg-')}`}>
                              <i className={`${typeInfo.icon}`}></i>
                            </div>
                            <div>
                              <p className="font-medium">{investment.instrumentName}</p>
                              <p className="text-sm text-gray-600">{typeInfo.label}</p>
                              <p className="text-xs text-gray-500">
                                Quantity: {parseFloat(investment.quantity).toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500">
                                Avg. Price: {formatCurrency(investment.purchasePrice)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-gray-900 mb-1">
                              {formatCurrency(investment.totalValue)}
                            </p>
                            <p className={`text-sm font-medium ${
                              parseFloat(investment.profitLoss) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {parseFloat(investment.profitLoss) >= 0 ? '+' : ''}
                              {formatCurrency(investment.profitLoss)} ({profitLossPercent.toFixed(2)}%)
                            </p>
                            <p className="text-xs text-gray-500">
                              Current: {formatCurrency(investment.currentPrice)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle>Savings Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savingsGoals.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-target text-gray-400 text-6xl mb-4"></i>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">Set Your Financial Goals</h3>
                    <p className="text-gray-600 mb-6">Create savings goals to track your progress towards important milestones.</p>
                    <Button onClick={() => setIsSavingsGoalDialogOpen(true)} className="bg-finora-primary hover:bg-finora-primary/90">
                      Create First Goal
                    </Button>
                  </div>
                ) : (
                  savingsGoals.map((goal) => {
                    const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
                    const remaining = parseFloat(goal.targetAmount) - parseFloat(goal.currentAmount);
                    
                    return (
                      <div key={goal.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-lg">{goal.name}</h3>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                            </p>
                            {goal.targetDate && (
                              <p className="text-xs text-gray-500">
                                Target: {new Date(goal.targetDate!).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              {progress.toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(remaining)} to go
                            </p>
                          </div>
                        </div>
                        <Progress value={progress} className="mb-2" />
                        {goal.autoDeposit && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <i className="fas fa-sync"></i>
                            <span>Auto-deposit: {formatCurrency(goal.depositAmount || '0')} {goal.depositFrequency}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Popular Stocks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockStocks.map((stock) => (
                    <div key={stock.symbol} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                      <div>
                        <p className="font-medium">{stock.symbol}</p>
                        <p className="text-sm text-gray-600">{stock.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(stock.price)}</p>
                        <p className={`text-sm ${stock.change.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.change}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Market News</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-b pb-3">
                    <h4 className="font-medium text-sm">Market rallies on positive economic data</h4>
                    <p className="text-xs text-gray-600 mt-1">Major indices close higher as inflation shows signs of cooling...</p>
                    <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                  </div>
                  <div className="border-b pb-3">
                    <h4 className="font-medium text-sm">Tech stocks lead gains in morning trading</h4>
                    <p className="text-xs text-gray-600 mt-1">Technology sector outperforms as earnings season approaches...</p>
                    <p className="text-xs text-gray-500 mt-1">4 hours ago</p>
                  </div>
                  <div className="pb-3">
                    <h4 className="font-medium text-sm">Federal Reserve hints at policy changes</h4>
                    <p className="text-xs text-gray-600 mt-1">Central bank signals potential adjustments to monetary policy...</p>
                    <p className="text-xs text-gray-500 mt-1">6 hours ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="forex">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <i className="fas fa-exchange-alt text-finora-primary"></i>
                Live Forex Rates
                <Badge variant="outline" className="ml-auto">USD Base</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {forexLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finora-primary"></div>
                </div>
              ) : forexData?.rates ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {forexData.rates.map((rate: any) => (
                    <div key={rate.currency} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-bold text-lg">USD/{rate.currency}</p>
                          <p className="text-2xl font-mono">{rate.rate.toFixed(4)}</p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={parseFloat(rate.change) >= 0 ? "default" : "destructive"}
                            className="mb-1"
                          >
                            {parseFloat(rate.change) >= 0 ? "+" : ""}{rate.changePercent}%
                          </Badge>
                          <p className="text-xs text-gray-500">24h change</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-500">Unable to load forex rates</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funds">
          <Card>
            <CardHeader>
              <CardTitle>Popular Mutual Funds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMutualFunds.map((fund) => (
                  <div key={fund.symbol} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium">{fund.name}</h3>
                        <p className="text-sm text-gray-600">Symbol: {fund.symbol}</p>
                        <div className="mt-2 flex gap-4 text-sm text-gray-600">
                          <span>Expense Ratio: 0.25%</span>
                          <span>Min. Investment: $1,000</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">{formatCurrency(fund.price)}</p>
                        <p className={`text-sm font-medium ${fund.change.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {fund.change}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}