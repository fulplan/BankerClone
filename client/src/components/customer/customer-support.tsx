import { useState, useRef, useEffect } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import type { SupportTicket, ChatMessage } from "@shared/schema";

interface TicketForm {
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const ticketCategories = [
  { value: 'account', label: 'Account Issues', icon: 'fas fa-user-circle' },
  { value: 'transfer', label: 'Transfers & Payments', icon: 'fas fa-exchange-alt' },
  { value: 'card', label: 'Card Problems', icon: 'fas fa-credit-card' },
  { value: 'investment', label: 'Investment Questions', icon: 'fas fa-chart-line' },
  { value: 'technical', label: 'Technical Support', icon: 'fas fa-cog' },
  { value: 'billing', label: 'Billing & Fees', icon: 'fas fa-file-invoice-dollar' },
  { value: 'fraud', label: 'Fraud & Security', icon: 'fas fa-shield-alt' },
  { value: 'other', label: 'General Inquiry', icon: 'fas fa-question-circle' },
];

const commonQuestions = [
  {
    question: "How do I reset my password?",
    answer: "You can reset your password by clicking 'Forgot Password' on the login page. We'll send a reset link to your registered email address."
  },
  {
    question: "What are your transfer fees?",
    answer: "Domestic transfers are free for amounts under $1,000. For amounts over $1,000, we charge a 0.1% fee. International transfers may have additional fees."
  },
  {
    question: "How long do transfers take?",
    answer: "Domestic transfers typically complete within 1-2 business days. International transfers can take 3-5 business days depending on the destination country."
  },
  {
    question: "How do I freeze my card?",
    answer: "You can instantly freeze your card through the Card Management section in your dashboard, or by contacting our support team immediately."
  },
  {
    question: "What documents do I need for verification?",
    answer: "You'll need a government-issued ID (driver's license or passport) and proof of address (utility bill or bank statement from the last 3 months)."
  },
  {
    question: "How do I close my account?",
    answer: "To close your account, please contact our support team. We'll guide you through the process and ensure all your funds are properly transferred."
  },
];

export default function CustomerSupport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isNewTicketDialogOpen, setIsNewTicketDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [ticketForm, setTicketForm] = useState<TicketForm>({
    subject: '',
    description: '',
    category: '',
    priority: 'medium',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: tickets = [], isLoading: ticketsLoading } = useQuery<SupportTicket[]>({
    queryKey: ["/api/support/tickets"],
    retry: false,
  });

  const { data: chatMessages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/support/tickets", selectedTicket?.id, "messages"],
    enabled: !!selectedTicket,
    retry: false,
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data: TicketForm) => {
      const response = await apiRequest("POST", "/api/support/tickets", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Support ticket created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets"] });
      setIsNewTicketDialogOpen(false);
      setTicketForm({
        subject: '',
        description: '',
        category: '',
        priority: 'medium',
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
        description: error.message || "Failed to create support ticket",
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const response = await apiRequest("POST", `/api/support/tickets/${ticketId}/messages`, { message });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/support/tickets", selectedTicket?.id, "messages"] });
      setChatMessage('');
      scrollToBottom();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleCreateTicket = () => {
    if (!ticketForm.subject || !ticketForm.description || !ticketForm.category) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createTicketMutation.mutate(ticketForm);
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim() || !selectedTicket) return;
    sendMessageMutation.mutate({ ticketId: selectedTicket.id, message: chatMessage.trim() });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = ticketCategories.find(c => c.value === category);
    return cat ? cat.icon : 'fas fa-question-circle';
  };

  const getCategoryLabel = (category: string) => {
    const cat = ticketCategories.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  if (ticketsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finora-primary"></div>
      </div>
    );
  }

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress');
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Support</h2>
          <p className="text-gray-600">Get help with your account and banking needs</p>
        </div>
        <Dialog open={isNewTicketDialogOpen} onOpenChange={setIsNewTicketDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-finora-primary hover:bg-finora-primary/90">
              <i className="fas fa-plus mr-2"></i>
              New Support Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Support Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {ticketCategories.map((category) => (
                    <Button
                      key={category.value}
                      variant={ticketForm.category === category.value ? "default" : "outline"}
                      className={`h-auto p-3 flex flex-col items-center gap-2 ${
                        ticketForm.category === category.value 
                          ? "bg-finora-primary text-white" 
                          : "hover:bg-finora-primary/10"
                      }`}
                      onClick={() => setTicketForm(prev => ({ ...prev, category: category.value }))}
                    >
                      <i className={`${category.icon} text-lg`}></i>
                      <span className="text-xs text-center">{category.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={ticketForm.priority} onValueChange={(value: any) => 
                  setTicketForm(prev => ({ ...prev, priority: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - General question</SelectItem>
                    <SelectItem value="medium">Medium - Account issue</SelectItem>
                    <SelectItem value="high">High - Urgent assistance needed</SelectItem>
                    <SelectItem value="urgent">Urgent - Security or fraud concern</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please provide details about your issue or question. The more information you provide, the better we can assist you."
                  rows={5}
                />
              </div>

              <Alert>
                <i className="fas fa-clock text-blue-600"></i>
                <AlertDescription>
                  Our support team typically responds within 2-4 hours during business hours (9 AM - 6 PM EST).
                </AlertDescription>
              </Alert>

              <Button 
                onClick={handleCreateTicket} 
                className="w-full bg-finora-primary hover:bg-finora-primary/90"
                disabled={createTicketMutation.isPending}
              >
                {createTicketMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <i className="fas fa-paper-plane mr-2"></i>
                )}
                Submit Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="tickets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tickets">My Tickets ({tickets.length})</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
          <TabsTrigger value="chat">Live Chat</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tickets List */}
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-headset text-gray-400 text-4xl mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Support Requests</h3>
                    <p className="text-gray-600 mb-4">You haven't submitted any support requests yet.</p>
                    <Button onClick={() => setIsNewTicketDialogOpen(true)} className="bg-finora-primary hover:bg-finora-primary/90">
                      Create First Request
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {openTickets.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-900 mb-2">Open Tickets</h4>
                        <div className="space-y-2">
                          {openTickets.map((ticket) => (
                            <div 
                              key={ticket.id} 
                              className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 ${
                                selectedTicket?.id === ticket.id ? 'border-finora-primary bg-finora-primary/5' : ''
                              }`}
                              onClick={() => setSelectedTicket(ticket)}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <i className={`${getCategoryIcon(ticket.category)} text-finora-primary`}></i>
                                  <span className="font-medium text-sm">{ticket.subject}</span>
                                </div>
                                <div className="flex gap-1">
                                  <Badge className={getStatusColor(ticket.status)}>
                                    {ticket.status.replace('_', ' ')}
                                  </Badge>
                                  <Badge className={getPriorityColor(ticket.priority)}>
                                    {ticket.priority}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 mb-1">
                                {getCategoryLabel(ticket.category)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Created: {new Date(ticket.createdAt!).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {resolvedTickets.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm text-gray-900 mb-2">Resolved Tickets</h4>
                        <div className="space-y-2">
                          {resolvedTickets.slice(0, 5).map((ticket) => (
                            <div 
                              key={ticket.id} 
                              className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 opacity-75 ${
                                selectedTicket?.id === ticket.id ? 'border-finora-primary bg-finora-primary/5' : ''
                              }`}
                              onClick={() => setSelectedTicket(ticket)}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <i className={`${getCategoryIcon(ticket.category)} text-green-600`}></i>
                                  <span className="font-medium text-sm">{ticket.subject}</span>
                                </div>
                                <Badge className={getStatusColor(ticket.status)}>
                                  {ticket.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-600 mb-1">
                                {getCategoryLabel(ticket.category)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Resolved: {ticket.updatedAt ? new Date(ticket.updatedAt!).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ticket Details & Chat */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {selectedTicket ? 'Ticket Details' : 'Select a Ticket'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTicket ? (
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{selectedTicket.subject}</h3>
                        <div className="flex gap-1">
                          <Badge className={getStatusColor(selectedTicket.status)}>
                            {selectedTicket.status.replace('_', ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(selectedTicket.priority)}>
                            {selectedTicket.priority}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{selectedTicket.description}</p>
                      <p className="text-xs text-gray-500">
                        Category: {getCategoryLabel(selectedTicket.category)} | 
                        Created: {new Date(selectedTicket.createdAt!).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Chat Messages */}
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Messages</h4>
                      <ScrollArea className="h-64 border rounded p-3">
                        <div className="space-y-3">
                          {chatMessages.map((message) => (
                            <div 
                              key={message.id}
                              className={`flex ${message.isFromAdmin ? 'justify-start' : 'justify-end'}`}
                            >
                              <div className={`max-w-[80%] p-3 rounded-lg ${
                                message.isFromAdmin 
                                  ? 'bg-gray-100 text-gray-900' 
                                  : 'bg-finora-primary text-white'
                              }`}>
                                <p className="text-sm">{message.message}</p>
                                <p className={`text-xs mt-1 ${
                                  message.isFromAdmin ? 'text-gray-500' : 'text-red-100'
                                }`}>
                                  {message.isFromAdmin ? 'Support Agent' : 'You'} • 
                                  {new Date(message.createdAt!).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>

                      {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                        <div className="flex gap-2">
                          <Input
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                            placeholder="Type your message..."
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          />
                          <Button 
                            onClick={handleSendMessage}
                            disabled={!chatMessage.trim() || sendMessageMutation.isPending}
                            className="bg-finora-primary hover:bg-finora-primary/90"
                          >
                            <i className="fas fa-paper-plane"></i>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <i className="fas fa-comments text-gray-400 text-4xl mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Ticket</h3>
                    <p className="text-gray-600">Choose a ticket from the list to view details and chat with our support team.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {commonQuestions.map((faq, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0">
                    <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-600 text-sm">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <i className="fas fa-phone text-blue-600"></i>
                  </div>
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-gray-600">1-800-SANTANDER (1-800-726-8263)</p>
                    <p className="text-xs text-gray-500">Available 24/7</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <i className="fas fa-envelope text-green-600"></i>
                  </div>
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-gray-600">support@finora.com</p>
                    <p className="text-xs text-gray-500">Response within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <i className="fas fa-comments text-purple-600"></i>
                  </div>
                  <div>
                    <p className="font-medium">Live Chat</p>
                    <p className="text-sm text-gray-600">Available through your dashboard</p>
                    <p className="text-xs text-gray-500">Mon-Fri 9 AM - 6 PM EST</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <i className="fas fa-map-marker-alt text-orange-600"></i>
                  </div>
                  <div>
                    <p className="font-medium">Branch Locations</p>
                    <p className="text-sm text-gray-600">Find a branch near you</p>
                    <Button variant="link" className="p-0 h-auto text-finora-primary">
                      Branch Locator
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-red-200 bg-red-50">
                  <i className="fas fa-exclamation-triangle text-red-600"></i>
                  <AlertDescription>
                    <strong>Lost or Stolen Cards</strong><br />
                    Call immediately: 1-800-SANTANDER<br />
                    Available 24/7 for card blocking and replacement
                  </AlertDescription>
                </Alert>

                <Alert className="border-yellow-200 bg-yellow-50">
                  <i className="fas fa-shield-alt text-yellow-600"></i>
                  <AlertDescription>
                    <strong>Fraud or Suspicious Activity</strong><br />
                    Report immediately through secure message or call our fraud hotline: 1-800-FRAUD-1<br />
                    We monitor accounts 24/7 for your protection
                  </AlertDescription>
                </Alert>

                <div className="pt-4">
                  <h4 className="font-medium mb-2">Business Hours</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                    <p>Saturday: 9:00 AM - 2:00 PM EST</p>
                    <p>Sunday: Closed</p>
                    <p className="text-xs text-gray-500 mt-2">Phone support available 24/7</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle>Live Chat Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <i className="fas fa-comments text-gray-400 text-6xl mb-4"></i>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Live Chat Coming Soon</h3>
                <p className="text-gray-600 mb-6">
                  Our live chat feature is currently in development. For immediate assistance, please create a support ticket or call us directly.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={() => setIsNewTicketDialogOpen(true)} className="bg-finora-primary hover:bg-finora-primary/90">
                    <i className="fas fa-ticket-alt mr-2"></i>
                    Create Ticket
                  </Button>
                  <Button variant="outline" className="border-finora-primary text-finora-primary hover:bg-finora-primary hover:text-white">
                    <i className="fas fa-phone mr-2"></i>
                    Call Support
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}