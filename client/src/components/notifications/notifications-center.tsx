import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { Bell, BellRing, CheckCircle2, X, Eye, Trash2, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  metadata: any;
  createdAt: string;
}

export default function NotificationsCenter() {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
  });

  // Fetch unread count
  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/unread-count');
      if (!response.ok) throw new Error('Failed to fetch unread count');
      return response.json();
    },
  });

  // Fetch recent admin responses
  const { data: recentAdminResponses } = useQuery<Notification[]>({
    queryKey: ['recent-admin-responses'],
    queryFn: async () => {
      const response = await fetch('/api/notifications/recent-admin-responses');
      if (!response.ok) throw new Error('Failed to fetch recent admin responses');
      return response.json();
    },
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['recent-admin-responses'] });
    },
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to mark all notifications as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast({ title: "Success", description: "All notifications marked as read" });
    },
  });

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast({ title: "Success", description: "Notification deleted" });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDialog(true);
    
    // Mark as read if unread
    if (notification.status === 'unread') {
      markAsReadMutation.mutate(notification.id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'admin_response':
      case 'admin_announcement':
      case 'support_response':
        return <BellRing className="h-5 w-5 text-blue-600" />;
      case 'account_update':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'security':
        return <Bell className="h-5 w-5 text-red-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'admin_response':
      case 'admin_announcement':
        return 'bg-blue-100 text-blue-800';
      case 'account_update':
        return 'bg-green-100 text-green-800';
      case 'security':
      case 'fraud_alert':
        return 'bg-red-100 text-red-800';
      case 'support_response':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const unreadNotifications = notifications?.filter(n => n.status === 'unread') || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            Notifications Center
            {unreadCount && unreadCount.count > 0 && (
              <Badge className="bg-red-100 text-red-800 ml-2">
                {unreadCount.count} unread
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            Stay updated with admin responses and important account notifications
          </p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button onClick={() => markAllAsReadMutation.mutate()} disabled={markAllAsReadMutation.isPending}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Recent Admin Responses */}
      {recentAdminResponses && recentAdminResponses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-blue-600" />
              Recent Admin Responses
            </CardTitle>
            <CardDescription>
              Latest responses and notifications from our admin team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAdminResponses.slice(0, 3).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                    notification.status === 'unread' ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <Badge className={getNotificationBadgeColor(notification.type)}>
                      {notification.type.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>
            Complete history of all notifications and messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications && notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                    notification.status === 'unread' ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3" onClick={() => handleNotificationClick(notification)}>
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          {notification.status === 'unread' && (
                            <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <Badge className={getNotificationBadgeColor(notification.type)}>
                            {notification.type.replace('_', ' ')}
                          </Badge>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationClick(notification);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotificationMutation.mutate(notification.id);
                        }}
                        disabled={deleteNotificationMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
              <p className="text-gray-600">You have no notifications at this time.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Detail Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedNotification && getNotificationIcon(selectedNotification.type)}
              {selectedNotification?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedNotification && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={selectedNotification ? getNotificationBadgeColor(selectedNotification.type) : ''}>
                    {selectedNotification?.type.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {selectedNotification && formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true })}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedNotification && (
            <div className="py-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-800 leading-relaxed">{selectedNotification.message}</p>
                
                {selectedNotification.metadata && Object.keys(selectedNotification.metadata).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-sm mb-2">Additional Information:</h4>
                    <div className="text-sm text-gray-600">
                      {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace('_', ' ')}:</span>
                          <span className="font-mono">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
            {selectedNotification?.status === 'unread' && (
              <Button 
                onClick={() => {
                  markAsReadMutation.mutate(selectedNotification.id);
                  setShowDialog(false);
                }}
                disabled={markAsReadMutation.isPending}
              >
                Mark as Read
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}