import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Transfer } from "@shared/schema";

export default function TransferApproval() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: pendingTransfers = [], isLoading } = useQuery<Transfer[]>({
    queryKey: ["/api/admin/transfers/pending"],
    refetchInterval: 5000, // Refresh every 5 seconds
    retry: false,
  });

  const approveMutation = useMutation({
    mutationFn: async (transferId: string) => {
      await apiRequest("POST", `/api/admin/transfers/${transferId}/approve`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transfer approved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transfers/pending"] });
      setSelectedTransfer(null);
    },
    onError: (error) => {
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

  const rejectMutation = useMutation({
    mutationFn: async ({ transferId, reason }: { transferId: string; reason: string }) => {
      await apiRequest("POST", `/api/admin/transfers/${transferId}/reject`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transfer rejected successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/transfers/pending"] });
      setSelectedTransfer(null);
      setRejectionReason("");
    },
    onError: (error) => {
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

  const handleApprove = (transfer: Transfer) => {
    approveMutation.mutate(transfer.id);
  };

  const handleReject = () => {
    if (!selectedTransfer || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a rejection reason",
        variant: "destructive",
      });
      return;
    }
    rejectMutation.mutate({ transferId: selectedTransfer.id, reason: rejectionReason });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-santander-red mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading pending transfers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pending Transfer Approvals</span>
            <Badge variant="destructive">{pendingTransfers.length} pending</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTransfers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending transfers requiring approval
            </div>
          ) : (
            <div className="space-y-4">
              {pendingTransfers.map((transfer: Transfer) => (
                <Card key={transfer.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-lg" data-testid={`text-transfer-amount-${transfer.id}`}>
                          ${transfer.amount}
                        </h4>
                        <p className="text-gray-600">
                          To: {transfer.toAccountHolderName}
                        </p>
                        {transfer.toAccountNumber && (
                          <p className="text-gray-600">
                            Account: {transfer.toAccountNumber}
                          </p>
                        )}
                        {transfer.toBankName && (
                          <p className="text-gray-600">
                            Bank: {transfer.toBankName}
                          </p>
                        )}
                        {transfer.description && (
                          <p className="text-gray-600">
                            Description: {transfer.description}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Transfer Amount:</span>
                            <span>${transfer.amount}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Fee:</span>
                            <span>${transfer.fee}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Tax:</span>
                            <span>${transfer.tax}</span>
                          </div>
                          <div className="flex justify-between font-semibold border-t pt-2">
                            <span>Total:</span>
                            <span>${(parseFloat(transfer.amount) + parseFloat(transfer.fee) + parseFloat(transfer.tax)).toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                          <p className="text-xs text-gray-500">
                            Submitted: {transfer.createdAt ? new Date(transfer.createdAt).toLocaleString() : 'N/A'}
                          </p>
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleApprove(transfer)}
                              disabled={approveMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                              data-testid={`button-approve-${transfer.id}`}
                            >
                              {approveMutation.isPending ? "Approving..." : "Approve"}
                            </Button>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  onClick={() => setSelectedTransfer(transfer)}
                                  variant="destructive"
                                  data-testid={`button-reject-${transfer.id}`}
                                >
                                  Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Reject Transfer</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <p>
                                    Are you sure you want to reject this transfer of ${transfer.amount}?
                                  </p>
                                  <div>
                                    <label htmlFor="rejection-reason" className="block text-sm font-medium mb-2">
                                      Rejection Reason
                                    </label>
                                    <Textarea
                                      id="rejection-reason"
                                      value={rejectionReason}
                                      onChange={(e) => setRejectionReason(e.target.value)}
                                      placeholder="Please provide a reason for rejection"
                                      rows={3}
                                      data-testid="textarea-rejection-reason"
                                    />
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button
                                      onClick={handleReject}
                                      disabled={rejectMutation.isPending}
                                      variant="destructive"
                                      data-testid="button-confirm-reject"
                                    >
                                      {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
