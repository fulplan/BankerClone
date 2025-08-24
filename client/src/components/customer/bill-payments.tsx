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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Account, BillPayment } from "@shared/schema";

interface BillPaymentForm {
  accountId: string;
  billType: string;
  billerName: string;
  billerAccountNumber: string;
  amount: string;
  dueDate: string;
  isRecurring: boolean;
  recurringFrequency: string;
}

const billTypes = [
  { value: 'utilities', label: 'Utilities (Electric, Gas, Water)', icon: 'fas fa-bolt' },
  { value: 'internet', label: 'Internet & Cable TV', icon: 'fas fa-wifi' },
  { value: 'phone', label: 'Phone & Mobile', icon: 'fas fa-phone' },
  { value: 'insurance', label: 'Insurance', icon: 'fas fa-shield-alt' },
  { value: 'rent', label: 'Rent & Mortgage', icon: 'fas fa-home' },
  { value: 'loan', label: 'Loans & Credit Cards', icon: 'fas fa-credit-card' },
  { value: 'education', label: 'School & Education', icon: 'fas fa-graduation-cap' },
  { value: 'healthcare', label: 'Healthcare & Medical', icon: 'fas fa-hospital' },
  { value: 'subscription', label: 'Subscriptions & Memberships', icon: 'fas fa-calendar' },
  { value: 'other', label: 'Other Bills', icon: 'fas fa-file-invoice' },
];

export default function BillPayments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPayBillDialogOpen, setIsPayBillDialogOpen] = useState(false);
  const [selectedBillType, setSelectedBillType] = useState('');
  const [billForm, setBillForm] = useState<BillPaymentForm>({
    accountId: '',
    billType: '',
    billerName: '',
    billerAccountNumber: '',
    amount: '',
    dueDate: '',
    isRecurring: false,
    recurringFrequency: 'monthly',
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
    retry: false,
  });

  const { data: billPayments = [], isLoading: billPaymentsLoading } = useQuery<BillPayment[]>({
    queryKey: ["/api/bill-payments"],
    retry: false,
  });

  const payBillMutation = useMutation({
    mutationFn: async (data: BillPaymentForm) => {
      const response = await apiRequest("POST", "/api/bill-payments", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bill payment scheduled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bill-payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setIsPayBillDialogOpen(false);
      setBillForm({
        accountId: '',
        billType: '',
        billerName: '',
        billerAccountNumber: '',
        amount: '',
        dueDate: '',
        isRecurring: false,
        recurringFrequency: 'monthly',
      });
      setSelectedBillType('');
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
        description: error.message || "Failed to schedule bill payment",
        variant: "destructive",
      });
    },
  });

  const cancelBillMutation = useMutation({
    mutationFn: async (billId: string) => {
      const response = await apiRequest("DELETE", `/api/bill-payments/${billId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bill payment cancelled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bill-payments"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel bill payment",
        variant: "destructive",
      });
    },
  });

  const handlePayBill = () => {
    if (!billForm.accountId || !billForm.billType || !billForm.billerName || !billForm.amount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    payBillMutation.mutate(billForm);
  };

  const handleCancelBill = (billId: string) => {
    if (confirm('Are you sure you want to cancel this bill payment?')) {
      cancelBillMutation.mutate(billId);
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
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getBillTypeIcon = (billType: string) => {
    const type = billTypes.find(t => t.value === billType);
    return type ? type.icon : 'fas fa-file-invoice';
  };

  const getBillTypeLabel = (billType: string) => {
    const type = billTypes.find(t => t.value === billType);
    return type ? type.label : billType;
  };

  if (accountsLoading || billPaymentsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finora-primary"></div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const pendingBills = billPayments.filter(bill => bill.status === 'pending');
  const paidBills = billPayments.filter(bill => bill.status === 'paid');
  const recurringBills = billPayments.filter(bill => bill.isRecurring);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bill Payments</h2>
          <p className="text-gray-600">Pay your bills quickly and set up recurring payments</p>
        </div>
        <Dialog open={isPayBillDialogOpen} onOpenChange={setIsPayBillDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-finora-primary hover:bg-finora-primary/90">
              <i className="fas fa-plus mr-2"></i>
              Pay Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pay a Bill</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="billType">Bill Type</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {billTypes.map((type) => (
                    <Button
                      key={type.value}
                      variant={selectedBillType === type.value ? "default" : "outline"}
                      className={`h-auto p-3 flex flex-col items-center gap-2 ${
                        selectedBillType === type.value 
                          ? "bg-finora-primary text-white" 
                          : "hover:bg-finora-primary/10"
                      }`}
                      onClick={() => {
                        setSelectedBillType(type.value);
                        setBillForm(prev => ({ ...prev, billType: type.value }));
                      }}
                    >
                      <i className={`${type.icon} text-lg`}></i>
                      <span className="text-xs text-center">{type.label.split(' ')[0]}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {selectedBillType && (
                <>
                  <div>
                    <Label htmlFor="account">Pay From Account</Label>
                    <Select value={billForm.accountId} onValueChange={(value) => 
                      setBillForm(prev => ({ ...prev, accountId: value }))
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
                    <Label htmlFor="billerName">Company/Biller Name</Label>
                    <Input
                      id="billerName"
                      value={billForm.billerName}
                      onChange={(e) => setBillForm(prev => ({ ...prev, billerName: e.target.value }))}
                      placeholder="e.g., ConEd, Verizon, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="billerAccountNumber">Account Number</Label>
                    <Input
                      id="billerAccountNumber"
                      value={billForm.billerAccountNumber}
                      onChange={(e) => setBillForm(prev => ({ ...prev, billerAccountNumber: e.target.value }))}
                      placeholder="Your account number with the company"
                    />
                  </div>

                  <div>
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={billForm.amount}
                      onChange={(e) => setBillForm(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      min={today}
                      value={billForm.dueDate}
                      onChange={(e) => setBillForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isRecurring"
                      checked={billForm.isRecurring}
                      onCheckedChange={(checked) => 
                        setBillForm(prev => ({ ...prev, isRecurring: checked as boolean }))
                      }
                    />
                    <Label htmlFor="isRecurring">Make this a recurring payment</Label>
                  </div>

                  {billForm.isRecurring && (
                    <div>
                      <Label htmlFor="frequency">Payment Frequency</Label>
                      <Select value={billForm.recurringFrequency} onValueChange={(value) => 
                        setBillForm(prev => ({ ...prev, recurringFrequency: value }))
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
                  )}

                  <Button 
                    onClick={handlePayBill} 
                    className="w-full bg-finora-primary hover:bg-finora-primary/90"
                    disabled={payBillMutation.isPending}
                  >
                    {payBillMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <i className="fas fa-credit-card mr-2"></i>
                    )}
                    Schedule Payment
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-2">
              <i className="fas fa-clock text-yellow-600"></i>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{pendingBills.length}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
              <i className="fas fa-check text-green-600"></i>
            </div>
            <p className="text-2xl font-bold text-green-600">{paidBills.length}</p>
            <p className="text-sm text-gray-600">Paid This Month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
              <i className="fas fa-sync text-blue-600"></i>
            </div>
            <p className="text-2xl font-bold text-blue-600">{recurringBills.length}</p>
            <p className="text-sm text-gray-600">Recurring</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
              <i className="fas fa-dollar-sign text-purple-600"></i>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(
                billPayments
                  .filter(bill => bill.status === 'paid')
                  .reduce((sum, bill) => sum + parseFloat(bill.amount), 0)
                  .toString()
              )}
            </p>
            <p className="text-sm text-gray-600">Total Paid</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">Pending ({pendingBills.length})</TabsTrigger>
          <TabsTrigger value="paid">Paid ({paidBills.length})</TabsTrigger>
          <TabsTrigger value="recurring">Recurring ({recurringBills.length})</TabsTrigger>
          <TabsTrigger value="all">All Bills ({billPayments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Bill Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingBills.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-check-circle text-gray-400 text-4xl mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Bills</h3>
                    <p className="text-gray-600">All your bills are up to date!</p>
                  </div>
                ) : (
                  pendingBills.map((bill) => (
                    <div key={bill.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-full">
                            <i className={`${getBillTypeIcon(bill.billType)} text-orange-600`}></i>
                          </div>
                          <div>
                            <p className="font-medium">{bill.billerName}</p>
                            <p className="text-sm text-gray-600">{getBillTypeLabel(bill.billType)}</p>
                            <p className="text-xs text-gray-500">
                              Account: ****{bill.billerAccountNumber.slice(-4)}
                            </p>
                            {bill.dueDate && (
                              <p className="text-xs text-gray-500">
                                Due: {new Date(bill.dueDate!).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-orange-600 mb-2">
                            {formatCurrency(bill.amount)}
                          </p>
                          <Badge className={getStatusColor(bill.status)}>
                            {bill.status}
                          </Badge>
                          {bill.isRecurring && (
                            <Badge variant="outline" className="ml-1">
                              {bill.recurringFrequency}
                            </Badge>
                          )}
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelBill(bill.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid">
          <Card>
            <CardHeader>
              <CardTitle>Paid Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paidBills.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No paid bills found</p>
                ) : (
                  paidBills.map((bill) => (
                    <div key={bill.id} className="border rounded-lg p-4 bg-green-50">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-full">
                            <i className={`${getBillTypeIcon(bill.billType)} text-green-600`}></i>
                          </div>
                          <div>
                            <p className="font-medium">{bill.billerName}</p>
                            <p className="text-sm text-gray-600">{getBillTypeLabel(bill.billType)}</p>
                            <p className="text-xs text-gray-500">
                              Paid: {new Date(bill.createdAt!).toLocaleDateString()}
                            </p>
                            {bill.reference && (
                              <p className="text-xs text-gray-500">
                                Ref: {bill.reference}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-green-600 mb-2">
                            {formatCurrency(bill.amount)}
                          </p>
                          <Badge className={getStatusColor(bill.status)}>
                            {bill.status}
                          </Badge>
                          {bill.isRecurring && (
                            <Badge variant="outline" className="ml-1">
                              {bill.recurringFrequency}
                            </Badge>
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

        <TabsContent value="recurring">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Bill Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recurringBills.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-sync text-gray-400 text-4xl mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Recurring Bills</h3>
                    <p className="text-gray-600 mb-4">Set up automatic bill payments to never miss a due date</p>
                    <Button onClick={() => setIsPayBillDialogOpen(true)} className="bg-finora-primary hover:bg-finora-primary/90">
                      Set Up Recurring Payment
                    </Button>
                  </div>
                ) : (
                  recurringBills.map((bill) => (
                    <div key={bill.id} className="border rounded-lg p-4 bg-blue-50">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <i className={`${getBillTypeIcon(bill.billType)} text-blue-600`}></i>
                          </div>
                          <div>
                            <p className="font-medium">{bill.billerName}</p>
                            <p className="text-sm text-gray-600">{getBillTypeLabel(bill.billType)}</p>
                            <p className="text-xs text-gray-500">
                              Every {bill.recurringFrequency}
                            </p>
                            {bill.dueDate && (
                              <p className="text-xs text-gray-500">
                                Next: {new Date(bill.dueDate!).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-blue-600 mb-2">
                            {formatCurrency(bill.amount)}
                          </p>
                          <Badge className="bg-blue-100 text-blue-800">
                            Recurring
                          </Badge>
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelBill(bill.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>All Bill Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {billPayments.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="fas fa-file-invoice text-gray-400 text-6xl mb-4"></i>
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Bills Found</h3>
                    <p className="text-gray-600 mb-6">Start by paying your first bill to see your payment history here.</p>
                    <Button onClick={() => setIsPayBillDialogOpen(true)} className="bg-finora-primary hover:bg-finora-primary/90">
                      Pay Your First Bill
                    </Button>
                  </div>
                ) : (
                  billPayments
                    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
                    .map((bill) => (
                      <div key={bill.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              bill.status === 'paid' ? 'bg-green-100' : 
                              bill.status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                            }`}>
                              <i className={`${getBillTypeIcon(bill.billType)} ${
                                bill.status === 'paid' ? 'text-green-600' : 
                                bill.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                              }`}></i>
                            </div>
                            <div>
                              <p className="font-medium">{bill.billerName}</p>
                              <p className="text-sm text-gray-600">{getBillTypeLabel(bill.billType)}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(bill.createdAt!).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold mb-2 ${
                              bill.status === 'paid' ? 'text-green-600' : 
                              bill.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {formatCurrency(bill.amount)}
                            </p>
                            <Badge className={getStatusColor(bill.status)}>
                              {bill.status}
                            </Badge>
                            {bill.isRecurring && (
                              <Badge variant="outline" className="ml-1">
                                {bill.recurringFrequency}
                              </Badge>
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
      </Tabs>
    </div>
  );
}