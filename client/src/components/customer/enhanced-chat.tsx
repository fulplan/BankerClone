import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { MessageCircle, Send, User, Headphones, Clock, CheckCircle2, AlertCircle, Refresh } from 'lucide-react';

interface ChatMessage {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  isFromAdmin: boolean;
  createdAt: string;
  sender?: {
    name: string;
    role: string;
  };
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  assignedTo?: string;
}

interface EnhancedChatProps {
  ticketId: string;
  ticket: SupportTicket;
  onClose?: () => void;
}

export default function EnhancedChat({ ticketId, ticket, onClose }: EnhancedChatProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isPolling, setIsPolling] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch messages with aggressive polling for real-time feel
  const { data: messages, isLoading, refetch } = useQuery<ChatMessage[]>({
    queryKey: ['chat-messages', ticketId],
    queryFn: async () => {
      const response = await fetch(`/api/chat/messages/${ticketId}`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    refetchInterval: isPolling ? 2000 : false, // Poll every 2 seconds when active
    refetchIntervalInBackground: false,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          content
        }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['chat-messages', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      
      // Force immediate refetch for instant UI update
      refetch();
      
      toast({
        title: "Message sent",
        description: "Your message has been delivered to our support team",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    if (newMessage.length > 1000) {
      toast({
        title: "Message too long",
        description: "Please keep messages under 1000 characters",
        variant: "destructive",
      });
      return;
    }
    
    sendMessageMutation.mutate(newMessage.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus management and polling control
  useEffect(() => {
    const handleFocus = () => setIsPolling(true);
    const handleBlur = () => setIsPolling(false);
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // Notification for new admin messages
  useEffect(() => {
    if (messages && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const isNewAdminMessage = lastMessage.isFromAdmin && 
        new Date(lastMessage.createdAt).getTime() > Date.now() - 10000; // Within last 10 seconds
      
      if (isNewAdminMessage && document.hidden) {
        // Show browser notification if page is not visible
        if (Notification.permission === 'granted') {
          new Notification('New support response', {
            body: lastMessage.message.substring(0, 100) + '...',
            icon: '/favicon.ico'
          });
        }
      }
    }
  }, [messages]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="default"><MessageCircle className="h-3 w-3 mr-1" />Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Resolved</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              Live Chat Support
            </CardTitle>
            <CardDescription>
              {ticket.subject} • Ticket #{ticketId.slice(-6)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(ticket.status)}
            {getPriorityBadge(ticket.priority)}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages Area */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {/* Initial ticket message */}
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 max-w-[80%]">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="font-medium text-blue-900 text-sm mb-1">You opened this ticket</p>
                  <p className="text-gray-800">{ticket.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-2 text-sm text-gray-600">Loading messages...</span>
              </div>
            ) : (
              messages?.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.isFromAdmin ? 'flex-row' : 'flex-row-reverse'
                  }`}
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback 
                      className={
                        message.isFromAdmin 
                          ? "bg-green-100 text-green-600" 
                          : "bg-blue-100 text-blue-600"
                      }
                    >
                      {message.isFromAdmin ? (
                        <Headphones className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 max-w-[80%]">
                    <div
                      className={`rounded-lg p-3 ${
                        message.isFromAdmin
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <p className="font-medium text-sm mb-1">
                        {message.isFromAdmin ? (
                          <span className="text-green-700">Support Agent</span>
                        ) : (
                          <span className="text-blue-700">You</span>
                        )}
                      </p>
                      <p className="text-gray-800 whitespace-pre-wrap">{message.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(message.createdAt).toLocaleString()}
                        {message.isFromAdmin && (
                          <span className="ml-2 inline-flex items-center">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Typing indicator would go here */}
            {sendMessageMutation.isPending && (
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">Sending message...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Message Input */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="shrink-0"
            title="Refresh messages"
          >
            <Refresh className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 relative">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                ticket.status === 'closed' 
                  ? "This ticket is closed. Please open a new ticket for assistance."
                  : "Type your message here... (Press Enter to send, Shift+Enter for new line)"
              }
              disabled={ticket.status === 'closed' || sendMessageMutation.isPending}
              className="min-h-[80px] resize-none pr-12"
              maxLength={1000}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {newMessage.length}/1000
            </div>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || ticket.status === 'closed' || sendMessageMutation.isPending}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isPolling ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span>{isPolling ? 'Live updates active' : 'Updates paused'}</span>
            </div>
            
            {messages && messages.length > 0 && (
              <span>
                Last updated: {new Date(messages[messages.length - 1]?.createdAt || '').toLocaleTimeString()}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span>Press Enter to send</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Request notification permission when component mounts
if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}