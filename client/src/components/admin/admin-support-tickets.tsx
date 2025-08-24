import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { SupportTicket, ChatMessage } from "@shared/schema";

export default function AdminSupportTickets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const { data: allTickets = [], isLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/admin/support/tickets"],
    refetchInterval: 5000, // Refresh every 5 seconds
    retry: false,
  });

  const { data: messages = [] } = useQuery<ChatMessage[]>({
    queryKey: ["/api/admin/support/tickets", selectedTicket?.id, "messages"],
    enabled: !!selectedTicket,
    refetchInterval: 2000, // Refresh every 2 seconds when ticket is open
  });

  const sendReplyMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      await apiRequest("POST", `/api/admin/support/tickets/${ticketId}/messages`, { message });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Reply sent successfully",
      });
      setReplyMessage("");
      queryClient.invalidateQueries({ 
        queryKey: ["/api/admin/support/tickets", selectedTicket?.id, "messages"] 
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
        description: error.message || "Failed to send reply",
        variant: "destructive",
      });
    },
  });

  const updateTicketStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      await apiRequest("PUT", `/api/admin/support/tickets/${ticketId}`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ticket status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
      setSelectedTicket(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update ticket status",
        variant: "destructive",
      });
    },
  });

  const assignTicketMutation = useMutation({
    mutationFn: async ({ ticketId, assignedTo }: { ticketId: string; assignedTo: string }) => {
      await apiRequest("PUT", `/api/admin/support/tickets/${ticketId}`, { assignedTo });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ticket assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/support/tickets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign ticket",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openTickets = allTickets.filter(ticket => ticket.status === 'open');
  const inProgressTickets = allTickets.filter(ticket => ticket.status === 'in_progress');
  const resolvedTickets = allTickets.filter(ticket => ticket.status === 'resolved' || ticket.status === 'closed');

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-santander-red mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading support tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Support Ticket Management</h2>
          <p className="text-gray-600">Manage and respond to customer support requests</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Badge variant="outline" className="bg-green-50">
            Open: {openTickets.length}
          </Badge>
          <Badge variant="outline" className="bg-yellow-50">
            In Progress: {inProgressTickets.length}
          </Badge>
          <Badge variant="outline" className="bg-blue-50">
            Resolved: {resolvedTickets.length}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="open" className="space-y-6">
        <TabsList>
          <TabsTrigger value="open">Open ({openTickets.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({inProgressTickets.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedTickets.length})</TabsTrigger>
          <TabsTrigger value="all">All Tickets ({allTickets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          <TicketList 
            tickets={openTickets} 
            onTicketSelect={setSelectedTicket}
            onStatusUpdate={updateTicketStatusMutation.mutate}
            onAssign={assignTicketMutation.mutate}
          />
        </TabsContent>

        <TabsContent value="in_progress">
          <TicketList 
            tickets={inProgressTickets} 
            onTicketSelect={setSelectedTicket}
            onStatusUpdate={updateTicketStatusMutation.mutate}
            onAssign={assignTicketMutation.mutate}
          />
        </TabsContent>

        <TabsContent value="resolved">
          <TicketList 
            tickets={resolvedTickets} 
            onTicketSelect={setSelectedTicket}
            onStatusUpdate={updateTicketStatusMutation.mutate}
            onAssign={assignTicketMutation.mutate}
          />
        </TabsContent>

        <TabsContent value="all">
          <TicketList 
            tickets={allTickets} 
            onTicketSelect={setSelectedTicket}
            onStatusUpdate={updateTicketStatusMutation.mutate}
            onAssign={assignTicketMutation.mutate}
          />
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Ticket #{selectedTicket?.id?.slice(-6)}: {selectedTicket?.subject}</span>
              <div className="flex gap-2">
                <Badge className={getStatusColor(selectedTicket?.status || '')}>
                  {selectedTicket?.status}
                </Badge>
                <Badge className={getPriorityColor(selectedTicket?.priority || '')}>
                  {selectedTicket?.priority} priority
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Customer</Label>
                  <p className="text-sm">User ID: {selectedTicket.userId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Category</Label>
                  <p className="text-sm capitalize">{selectedTicket.category}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Created</Label>
                  <p className="text-sm">
                    {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Assigned To</Label>
                  <p className="text-sm">{selectedTicket.assignedTo || 'Unassigned'}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Description</Label>
                <p className="mt-1 text-sm bg-white p-3 rounded border">{selectedTicket.description}</p>
              </div>

              {/* Chat Messages */}
              <div>
                <Label className="text-sm font-medium text-gray-700">Conversation</Label>
                <div className="mt-2 space-y-3 max-h-60 overflow-y-auto bg-white border rounded p-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isFromAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg ${
                          message.isFromAdmin
                            ? 'bg-santander-red text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.isFromAdmin ? 'text-red-100' : 'text-gray-500'
                        }`}>
                          {message.createdAt ? new Date(message.createdAt).toLocaleString() : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Section */}
              <div className="space-y-3">
                <Label htmlFor="reply">Send Reply</Label>
                <Textarea
                  id="reply"
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      if (replyMessage.trim() && selectedTicket) {
                        sendReplyMutation.mutate({
                          ticketId: selectedTicket.id,
                          message: replyMessage,
                        });
                      }
                    }}
                    disabled={!replyMessage.trim() || sendReplyMutation.isPending}
                    className="bg-santander-red hover:bg-santander-red/90"
                  >
                    <i className="fas fa-reply mr-2"></i>
                    Send Reply
                  </Button>
                  
                  <Select
                    value={selectedTicket.status}
                    onValueChange={(status) => {
                      updateTicketStatusMutation.mutate({
                        ticketId: selectedTicket.id,
                        status,
                      });
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TicketListProps {
  tickets: SupportTicket[];
  onTicketSelect: (ticket: SupportTicket) => void;
  onStatusUpdate: (params: { ticketId: string; status: string }) => void;
  onAssign: (params: { ticketId: string; assignedTo: string }) => void;
}

function TicketList({ tickets, onTicketSelect, onStatusUpdate, onAssign }: TicketListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <i className="fas fa-ticket-alt text-4xl text-gray-300 mb-4"></i>
          <p className="text-gray-500">No tickets found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {tickets.map((ticket) => (
        <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">
                  {ticket.subject}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                  {ticket.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Customer: {ticket.userId}</span>
                  <span>Category: {ticket.category}</span>
                  <span>
                    Created: {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex gap-2">
                  <Badge className={getStatusColor(ticket.status)}>
                    {ticket.status}
                  </Badge>
                  <Badge className={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onTicketSelect(ticket)}
                  data-testid={`button-view-ticket-${ticket.id}`}
                >
                  <i className="fas fa-eye mr-1"></i>
                  View & Reply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}