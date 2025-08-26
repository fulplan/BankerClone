import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import TransferForm from "@/components/customer/transfer-form";
import TransactionHistory from "@/components/customer/transaction-history";
import type { Account, Transfer, StandingOrder } from "@shared/schema";

export default function TransferCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isStandingOrderDialogOpen, setIsStandingOrderDialogOpen] = useState(false);
  const [standingOrderForm, setStandingOrderForm] = useState({
    fromAccountId: '',
    toAccountNumber: '',
    toAccountHolderName: '',
    amount: '',
    frequency: 'monthly',
    description: '',
    nextPaymentDate: '',
    endDate: '',
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
    retry: false,
  });

  const { data: transfers = [], isLoading: transfersLoading } = useQuery<Transfer[]>({
    queryKey: ["/api/transfers"],
    retry: false,
  });

  const { data: standingOrders = [], isLoading: standingOrdersLoading } = useQuery<StandingOrder[]>({
    queryKey: ["/api/standing-orders"],
    retry: false,
  });

  const createStandingOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/standing-orders", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Standing order created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/standing-orders"] });
      setIsStandingOrderDialogOpen(false);
      setStandingOrderForm({
        fromAccountId: '',
        toAccountNumber: '',
        toAccountHolderName: '',
        amount: '',
        frequency: 'monthly',
        description: '',
        nextPaymentDate: '',
        endDate: '',
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
        description: error.message || "Failed to create standing order",
        variant: "destructive",
      });
    },
  });

  const cancelStandingOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("DELETE", `/api/standing-orders/${orderId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Standing order cancelled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/standing-orders"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel standing order",
        variant: "destructive",
      });
    },
  });

  const handleCreateStandingOrder = () => {
    if (!standingOrderForm.fromAccountId || !standingOrderForm.toAccountNumber || !standingOrderForm.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createStandingOrderMutation.mutate(standingOrderForm);
  };

  const handleCancelStandingOrder = (orderId: string) => {
    if (confirm('Are you sure you want to cancel this standing order?')) {
      cancelStandingOrderMutation.mutate(orderId);
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (accountsLoading || transfersLoading || standingOrdersLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finora-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="text-center sm:text-left">
          <h2 className="text-2xl font-bold text-gray-900">Transfer Center</h2>
          <p className="text-gray-600 text-sm sm:text-base">Send money, manage transfers, and set up recurring payments</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Dialog open={isStandingOrderDialogOpen} onOpenChange={setIsStandingOrderDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-finora-primary hover:bg-finora-primary/90">
              <i className="fas fa-plus mr-2"></i>
              New Standing Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Standing Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="fromAccount">From Account</Label>
                <Select value={standingOrderForm.fromAccountId} onValueChange={(value) => 
                  setStandingOrderForm(prev => ({ ...prev, fromAccountId: value }))
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
                <Label htmlFor="toAccountNumber">Recipient Account Number</Label>
                <Input
                  id="toAccountNumber"
                  value={standingOrderForm.toAccountNumber}
                  onChange={(e) => setStandingOrderForm(prev => ({ ...prev, toAccountNumber: e.target.value }))}
                  placeholder="Enter account number"
                />
              </div>

              <div>
                <Label htmlFor="toAccountHolderName">Recipient Name</Label>
                <Input
                  id="toAccountHolderName"
                  value={standingOrderForm.toAccountHolderName}
                  onChange={(e) => setStandingOrderForm(prev => ({ ...prev, toAccountHolderName: e.target.value }))}
                  placeholder="Enter recipient name"
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={standingOrderForm.amount}
                  onChange={(e) => setStandingOrderForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={standingOrderForm.frequency} onValueChange={(value) => 
                  setStandingOrderForm(prev => ({ ...prev, frequency: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nextPaymentDate">First Payment Date</Label>
                <Input
                  id="nextPaymentDate"
                  type="date"
                  value={standingOrderForm.nextPaymentDate}
                  onChange={(e) => setStandingOrderForm(prev => ({ ...prev, nextPaymentDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date (Optional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={standingOrderForm.endDate}
                  onChange={(e) => setStandingOrderForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={standingOrderForm.description}
                  onChange={(e) => setStandingOrderForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Payment description"
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleCreateStandingOrder} 
                className="w-full bg-finora-primary hover:bg-finora-primary/90"
                disabled={createStandingOrderMutation.isPending}
              >
                {createStandingOrderMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <i className="fas fa-plus mr-2"></i>
                )}
                Create Standing Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="send" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="send">Send Money</TabsTrigger>
          <TabsTrigger value="history">Transfer History</TabsTrigger>
          <TabsTrigger value="standing">Standing Orders ({standingOrders.length})</TabsTrigger>
          <TabsTrigger value="transactions">All Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <TransferForm />
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Transfer History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transfers.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No transfers found</p>
                ) : (
                  transfers.map((transfer) => (
                    <div key={transfer.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 rounded-full">
                              <i className="fas fa-exchange-alt text-blue-600"></i>
                            </div>
                            <div>
                              <p className="font-medium">To: {transfer.toAccountHolderName}</p>
                              <p className="text-sm text-gray-600">
                                Account: ****{transfer.toAccountNumber?.slice(-4)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{transfer.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(transfer.createdAt!).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-red-600 mb-1">
                            -{formatCurrency(transfer.amount)}
                          </p>
                          <Badge className={getStatusColor(transfer.status)}>
                            {transfer.status}
                          </Badge>
                          {parseFloat(transfer.fee) > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Fee: {formatCurrency(transfer.fee)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="standing">
          <Card>
            <CardHeader>
              <CardTitle>Standing Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {standingOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-calendar-check text-gray-400 text-4xl mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Standing Orders</h3>
                    <p className="text-gray-600 mb-4">Set up recurring payments for bills and regular transfers</p>
                    <Button onClick={() => setIsStandingOrderDialogOpen(true)} className="bg-finora-primary hover:bg-finora-primary/90">
                      Create First Standing Order
                    </Button>
                  </div>
                ) : (
                  standingOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-100 rounded-full">
                              <i className="fas fa-calendar-check text-green-600"></i>
                            </div>
                            <div>
                              <p className="font-medium">To: {order.toAccountHolderName}</p>
                              <p className="text-sm text-gray-600">
                                Account: ****{order.toAccountNumber.slice(-4)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{order.description || 'Regular payment'}</p>
                          <p className="text-xs text-gray-500">
                            Next payment: {new Date(order.nextPaymentDate!).toLocaleDateString()} | {order.frequency}
                          </p>
                          {order.endDate && (
                            <p className="text-xs text-gray-500">
                              Until: {new Date(order.endDate!).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-blue-600 mb-2">
                            {formatCurrency(order.amount)}
                          </p>
                          <Badge className={order.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {order.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          {order.isActive && (
                            <div className="mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelStandingOrder(order.id)}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}