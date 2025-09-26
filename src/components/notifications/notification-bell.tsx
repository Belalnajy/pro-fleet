"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bell, Check, X, Truck, MapPin, Clock, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [updatingNotification, setUpdatingNotification] = useState<string | null>(null);

  // جلب الإشعارات من API
  const fetchNotifications = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/customer/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // تحديث الإشعارات كل 30 ثانية
  useEffect(() => {
    if (session?.user?.role === 'CUSTOMER') {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // WebSocket للإشعارات المباشرة (معطل مؤقتاً)
  useEffect(() => {
    // TODO: تفعيل WebSocket عند إنشاء endpoint
    // if (!session?.user?.id || session.user.role !== 'CUSTOMER') return;

    // const ws = new WebSocket(`ws://localhost:3000/api/notifications/ws?userId=${session.user.id}`);
    
    // ws.onmessage = (event) => {
    //   try {
    //     const notification: Notification = JSON.parse(event.data);
        
    //     // إضافة الإشعار الجديد
    //     setNotifications(prev => [notification, ...prev.slice(0, 19)]); // آخر 20 إشعار
    //     setUnreadCount(prev => prev + 1);
        
    //     // عرض toast notification
    //     toast({
    //       title: notification.title,
    //       description: notification.message,
    //       duration: 5000,
    //     });
        
    //     // صوت الإشعار (اختياري)
    //     if ('Notification' in window && Notification.permission === 'granted') {
    //       new Notification(notification.title, {
    //         body: notification.message,
    //         icon: '/logo.svg'
    //       });
    //     }
    //   } catch (error) {
    //     console.error('Error parsing notification:', error);
    //   }
    // };

    // return () => ws.close();
  }, [session, toast]);

  // طلب إذن الإشعارات
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // تحديد أيقونة الإشعار
  const getNotificationIcon = (type: string, iconType?: string) => {
    switch (iconType || type) {
      case 'truck':
      case 'driver_assigned':
        return <Truck className="h-4 w-4 text-blue-600" />;
      case 'map':
      case 'location_update':
        return <MapPin className="h-4 w-4 text-green-600" />;
      case 'package':
      case 'delivery':
        return <Package className="h-4 w-4 text-purple-600" />;
      case 'clock':
      case 'trip_status':
        return <Clock className="h-4 w-4 text-orange-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  // تحديد لون الإشعار
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'driver_assigned':
        return 'border-l-blue-500';
      case 'location_update':
        return 'border-l-green-500';
      case 'delivery':
        return 'border-l-purple-500';
      case 'trip_status':
        return 'border-l-orange-500';
      default:
        return 'border-l-gray-500';
    }
  };

  // تحديث حالة القراءة
  const markAsRead = async (notificationId: string) => {
    try {
      // التحقق إذا كان الإشعار غير مقروء بالفعل
      const notification = notifications.find(n => n.id === notificationId);
      if (!notification || notification.isRead) {
        return; // لا حاجة لتحديث إذا كان مقروءاً بالفعل
      }

      setUpdatingNotification(notificationId);

      const response = await fetch(`/api/customer/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // إشعار نجاح
        toast({
          title: "تم تحديد الإشعار كمقروء",
          description: "تم تحديث حالة الإشعار بنجاح",
          duration: 2000,
        });
        
        // إعادة تحميل الإشعارات للتأكد من التزامن
        setTimeout(() => {
          fetchNotifications();
        }, 500);
      } else {
        console.error('Failed to mark notification as read:', response.status);
        toast({
          title: "خطأ",
          description: "فشل في تحديث حالة الإشعار",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setUpdatingNotification(null);
    }
  };

  // تحديد جميع الإشعارات كمقروءة
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/customer/notifications/mark-all-read', {
        method: 'PATCH'
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        
        // إشعار نجاح
        toast({
          title: "تم تحديد جميع الإشعارات كمقروءة",
          description: "تم تحديث جميع الإشعارات بنجاح",
          duration: 2000,
        });
        
        // إعادة تحميل الإشعارات للتأكد من التزامن
        setTimeout(() => {
          fetchNotifications();
        }, 500);
      } else {
        console.error('Failed to mark all notifications as read:', response.status);
        toast({
          title: "خطأ",
          description: "فشل في تحديث الإشعارات",
          variant: "destructive",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // تنسيق الوقت
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} يوم`;
    if (hours > 0) return `${hours} ساعة`;
    if (minutes > 0) return `${minutes} دقيقة`;
    return 'الآن';
  };

  if (session?.user?.role !== 'CUSTOMER') return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative p-2 hover:bg-gray-100 rounded-full"
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-0"
        sideOffset={5}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">الإشعارات</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  تحديد الكل كمقروء
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">لا توجد إشعارات</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer border-l-4 ${getNotificationColor(notification.type)} ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      } ${updatingNotification === notification.id ? 'opacity-50' : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3 space-x-reverse">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type, notification.data?.icon)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notification.title}
                            </p>
                            {!notification.isRead && updatingNotification !== notification.id && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                            )}
                            {updatingNotification === notification.id && (
                              <div className="w-4 h-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent flex-shrink-0"></div>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex flex-col gap-1">
                              {notification.data?.tripNumber && (
                                <span className="text-xs text-blue-600 font-medium">
                                  {notification.data.tripNumber}
                                </span>
                              )}
                              {notification.data?.tripDetails?.route && (
                                <span className="text-xs text-gray-600">
                                  📍 {notification.data.tripDetails.route}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatTime(new Date(notification.createdAt))}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
