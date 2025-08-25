import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Account } from "@shared/schema";
import bankingCustomerService from "@assets/generated_images/diverse_customer_service_banking_professional_b409fbf2.png";
import mobileBankingApp from "@assets/generated_images/professional_mobile_banking_usage_904a481c.png";

export default function AccountOverview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newAccountType, setNewAccountType] = useState("");

  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
    retry: false,
  });

  const createAccountMutation = useMutation({
    mutationFn: async (accountType: string) => {
      await apiRequest("POST", "/api/accounts", { accountType });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Account created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setNewAccountType("");
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateAccount = () => {
    if (!newAccountType) {
      toast({
        title: "Error",
        description: "Please select an account type",
        variant: "destructive",
      });
      return;
    }
    createAccountMutation.mutate(newAccountType);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'frozen':
        return 'bg-orange-100 text-orange-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTotalBalance = () => {
    return accounts
      .filter((account: Account) => account.status === 'active')
      .reduce((total: number, account: Account) => total + parseFloat(account.balance), 0)
      .toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finora-primary mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading your accounts...</p>
      </div>
    );
  }

  // Check for account status warnings
  const frozenAccounts = accounts.filter((account: Account) => account.status === 'frozen');
  const closedAccounts = accounts.filter((account: Account) => account.status === 'closed');

  return (
    <div className="space-y-6">
      {/* Account Status Warnings */}
      {frozenAccounts.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Account Alert:</strong> You have {frozenAccounts.length} frozen account(s). 
            Please contact customer service to resolve any issues.
          </AlertDescription>
        </Alert>
      )}

      {closedAccounts.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Account Notice:</strong> You have {closedAccounts.length} closed account(s). 
            These accounts are no longer active and cannot be used for transactions.
          </AlertDescription>
        </Alert>
      )}

      {/* Total Balance Summary */}
      <Card className="border-l-4 border-l-finora-primary">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Balance</p>
              <p className="text-3xl font-bold text-gray-900" data-testid="text-total-balance">
                ${calculateTotalBalance()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Active Accounts</p>
              <p className="text-xl font-semibold text-finora-primary">
                {accounts.filter((account: Account) => account.status === 'active').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create New Account */}
      <Card>
        <CardHeader>
          <CardTitle>Open New Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Select onValueChange={setNewAccountType}>
              <SelectTrigger data-testid="select-account-type">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checking">Checking Account</SelectItem>
                <SelectItem value="savings">Savings Account</SelectItem>
                <SelectItem value="money_market">Money Market Account</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleCreateAccount}
            disabled={createAccountMutation.isPending}
            className="w-full bg-finora-primary hover:bg-finora-dark"
            data-testid="button-create-account"
          >
            {createAccountMutation.isPending ? "Creating..." : "Open Account"}
          </Button>
        </CardContent>
      </Card>

      {/* Accounts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Your Accounts</h3>
          <Badge variant="outline">{accounts.length} accounts</Badge>
        </div>
        
        {accounts.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-university text-gray-400 text-2xl"></i>
                </div>
                <p className="font-medium">No accounts found</p>
                <p className="text-sm">Open your first account to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {accounts.map((account: Account) => (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-lg capitalize">
                          {account.accountType.replace('_', ' ')} Account
                        </h4>
                        <Badge className={getStatusColor(account.status)}>
                          {account.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        <p data-testid={`text-account-number-${account.id}`}>
                          <span className="font-medium">Account Number:</span> ****{account.accountNumber.slice(-4)}
                        </p>
                        <p>
                          <span className="font-medium">Routing Number:</span> {account.routingNumber}
                        </p>
                        <p>
                          <span className="font-medium">Opened:</span> {new Date(account.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-600">Available Balance</p>
                      <p className="text-2xl font-bold text-gray-900" data-testid={`text-balance-${account.id}`}>
                        ${account.balance}
                      </p>
                      
                      {account.status === 'frozen' && (
                        <div className="mt-2 p-2 bg-orange-50 rounded-md">
                          <p className="text-xs text-orange-800">
                            Account is frozen. Contact customer service for assistance.
                          </p>
                        </div>
                      )}
                      
                      {account.status === 'closed' && (
                        <div className="mt-2 p-2 bg-red-50 rounded-md">
                          <p className="text-xs text-red-800">
                            Account is closed and no longer active.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Customer Service & Mobile Banking Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-headset text-finora-primary"></i>
              <span>Customer Service</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <img 
                src={bankingCustomerService} 
                alt="Customer Service Representative" 
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Need help with your account? Our customer service team is here to assist you.
                </p>
                <Button variant="outline" className="text-finora-primary border-finora-primary hover:bg-finora-primary hover:text-white">
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-mobile-alt text-finora-primary"></i>
              <span>Mobile Banking</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <img 
                src={mobileBankingApp} 
                alt="Mobile Banking App" 
                className="w-20 h-20 rounded-lg object-cover"
              />
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Bank on the go with our secure mobile app. Available 24/7 for your convenience.
                </p>
                <Button variant="outline" className="text-finora-primary border-finora-primary hover:bg-finora-primary hover:text-white">
                  Download App
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
