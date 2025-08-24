import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Card as BankCard, Account } from "@shared/schema";

interface CardRequest {
  accountId: string;
  cardType: 'debit' | 'credit' | 'virtual';
  spendingLimit?: string;
  dailyLimit?: string;
}

export default function CardManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCard, setSelectedCard] = useState<BankCard | null>(null);
  const [cardRequest, setCardRequest] = useState<CardRequest>({
    accountId: '',
    cardType: 'debit',
    spendingLimit: '5000',
    dailyLimit: '1000',
  });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: cards = [], isLoading: cardsLoading } = useQuery<BankCard[]>({
    queryKey: ["/api/cards"],
    retry: false,
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery<Account[]>({
    queryKey: ["/api/accounts"],
    retry: false,
  });

  const createCardMutation = useMutation({
    mutationFn: async (data: CardRequest) => {
      const response = await apiRequest("POST", "/api/cards", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Card requested successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
      setIsCreateDialogOpen(false);
      setCardRequest({
        accountId: '',
        cardType: 'debit',
        spendingLimit: '5000',
        dailyLimit: '1000',
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
        description: error.message || "Failed to create card",
        variant: "destructive",
      });
    },
  });

  const updateCardStatusMutation = useMutation({
    mutationFn: async ({ cardId, status }: { cardId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/cards/${cardId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Card status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update card status",
        variant: "destructive",
      });
    },
  });

  const updateCardLimitMutation = useMutation({
    mutationFn: async ({ cardId, spendingLimit, dailyLimit }: { cardId: string; spendingLimit?: string; dailyLimit?: string }) => {
      const response = await apiRequest("PATCH", `/api/cards/${cardId}/limits`, { spendingLimit, dailyLimit });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Card limits updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cards"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update card limits",
        variant: "destructive",
      });
    },
  });

  const handleCreateCard = () => {
    if (!cardRequest.accountId) {
      toast({
        title: "Error",
        description: "Please select an account",
        variant: "destructive",
      });
      return;
    }
    createCardMutation.mutate(cardRequest);
  };

  const handleFreezeCard = (cardId: string) => {
    updateCardStatusMutation.mutate({ cardId, status: 'frozen' });
  };

  const handleUnfreezeCard = (cardId: string) => {
    updateCardStatusMutation.mutate({ cardId, status: 'active' });
  };

  const handleCancelCard = (cardId: string) => {
    if (confirm('Are you sure you want to cancel this card? This action cannot be undone.')) {
      updateCardStatusMutation.mutate({ cardId, status: 'cancelled' });
    }
  };

  const getCardStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'frozen':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCardTypeIcon = (type: string) => {
    switch (type) {
      case 'credit':
        return 'fas fa-credit-card text-blue-600';
      case 'debit':
        return 'fas fa-credit-card text-green-600';
      case 'virtual':
        return 'fas fa-mobile-alt text-purple-600';
      default:
        return 'fas fa-credit-card text-gray-600';
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(parseFloat(amount));
  };

  const maskCardNumber = (cardNumber: string) => {
    return `****  ****  ****  ${cardNumber.slice(-4)}`;
  };

  if (cardsLoading || accountsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-santander-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Card Management</h2>
          <p className="text-gray-600">Manage your debit, credit, and virtual cards</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-santander-red hover:bg-santander-red/90">
              <i className="fas fa-plus mr-2"></i>
              Request New Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Request New Card</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="account">Select Account</Label>
                <Select value={cardRequest.accountId} onValueChange={(value) => 
                  setCardRequest(prev => ({ ...prev, accountId: value }))
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose account" />
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
                <Label htmlFor="cardType">Card Type</Label>
                <Select value={cardRequest.cardType} onValueChange={(value: any) => 
                  setCardRequest(prev => ({ ...prev, cardType: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debit">Debit Card</SelectItem>
                    <SelectItem value="credit">Credit Card</SelectItem>
                    <SelectItem value="virtual">Virtual Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="spendingLimit">Monthly Spending Limit ($)</Label>
                <Input
                  id="spendingLimit"
                  type="number"
                  value={cardRequest.spendingLimit}
                  onChange={(e) => setCardRequest(prev => ({ ...prev, spendingLimit: e.target.value }))}
                  placeholder="5000"
                />
              </div>

              <div>
                <Label htmlFor="dailyLimit">Daily Spending Limit ($)</Label>
                <Input
                  id="dailyLimit"
                  type="number"
                  value={cardRequest.dailyLimit}
                  onChange={(e) => setCardRequest(prev => ({ ...prev, dailyLimit: e.target.value }))}
                  placeholder="1000"
                />
              </div>

              <Button 
                onClick={handleCreateCard} 
                className="w-full bg-santander-red hover:bg-santander-red/90"
                disabled={createCardMutation.isPending}
              >
                {createCardMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <i className="fas fa-credit-card mr-2"></i>
                )}
                Request Card
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {cards.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <i className="fas fa-credit-card text-gray-400 text-6xl mb-4"></i>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Cards Found</h3>
            <p className="text-gray-600 mb-6">You don't have any cards yet. Request your first card to get started.</p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-santander-red hover:bg-santander-red/90"
            >
              Request Your First Card
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Cards ({cards.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({cards.filter(c => c.status === 'active').length})</TabsTrigger>
            <TabsTrigger value="frozen">Frozen ({cards.filter(c => c.status === 'frozen').length})</TabsTrigger>
            <TabsTrigger value="virtual">Virtual ({cards.filter(c => c.isVirtual).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.map((card) => (
                <Card key={card.id} className="overflow-hidden">
                  <CardHeader className={`text-white ${
                    card.type === 'credit' ? 'bg-gradient-to-r from-blue-600 to-blue-800' :
                    card.type === 'debit' ? 'bg-gradient-to-r from-green-600 to-green-800' :
                    'bg-gradient-to-r from-purple-600 to-purple-800'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm opacity-90">Santander Bank</p>
                        <p className="text-lg font-mono">{maskCardNumber(card.cardNumber)}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-white/20 text-white">
                          {card.type.toUpperCase()}
                        </Badge>
                        {card.isVirtual && (
                          <Badge className="bg-white/20 text-white ml-1">
                            VIRTUAL
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm opacity-90">Card Holder</p>
                        <p className="font-medium">{card.cardHolderName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm opacity-90">Expires</p>
                        <p className="font-mono">{card.expiryDate}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status:</span>
                        <Badge className={getCardStatusColor(card.status)}>
                          {card.status}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Monthly Limit:</span>
                          <span className="font-medium">{formatCurrency(card.spendingLimit)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Daily Limit:</span>
                          <span className="font-medium">{formatCurrency(card.dailyLimit)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        {card.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleFreezeCard(card.id)}
                            className="flex-1"
                          >
                            <i className="fas fa-snowflake mr-1"></i>
                            Freeze
                          </Button>
                        ) : card.status === 'frozen' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnfreezeCard(card.id)}
                            className="flex-1"
                          >
                            <i className="fas fa-unlock mr-1"></i>
                            Unfreeze
                          </Button>
                        ) : null}

                        {card.status !== 'cancelled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCard(card)}
                            className="flex-1"
                          >
                            <i className="fas fa-cog mr-1"></i>
                            Settings
                          </Button>
                        )}

                        {card.status !== 'cancelled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelCard(card.id)}
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <i className="fas fa-times mr-1"></i>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.filter(c => c.status === 'active').map((card) => (
                <Card key={card.id} className="overflow-hidden">
                  {/* Same card content as above */}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="frozen">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.filter(c => c.status === 'frozen').map((card) => (
                <Card key={card.id} className="overflow-hidden opacity-75">
                  {/* Same card content as above */}
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="virtual">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cards.filter(c => c.isVirtual).map((card) => (
                <Card key={card.id} className="overflow-hidden">
                  {/* Same card content as above */}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Card Settings Dialog */}
      {selectedCard && (
        <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Card Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Update Spending Limits</h4>
                <div className="space-y-3">
                  <div>
                    <Label>Monthly Spending Limit ($)</Label>
                    <Input
                      type="number"
                      defaultValue={selectedCard.spendingLimit}
                      onBlur={(e) => {
                        if (e.target.value !== selectedCard.spendingLimit) {
                          updateCardLimitMutation.mutate({
                            cardId: selectedCard.id,
                            spendingLimit: e.target.value,
                          });
                        }
                      }}
                    />
                  </div>
                  <div>
                    <Label>Daily Spending Limit ($)</Label>
                    <Input
                      type="number"
                      defaultValue={selectedCard.dailyLimit}
                      onBlur={(e) => {
                        if (e.target.value !== selectedCard.dailyLimit) {
                          updateCardLimitMutation.mutate({
                            cardId: selectedCard.id,
                            dailyLimit: e.target.value,
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <Alert>
                <i className="fas fa-info-circle text-blue-600"></i>
                <AlertDescription>
                  Changes to spending limits take effect immediately. You can update them anytime.
                </AlertDescription>
              </Alert>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}