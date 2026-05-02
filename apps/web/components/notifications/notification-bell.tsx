"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  useGetUnreadNotificationCountQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "@/lib/graphql/generated";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export function NotificationBell() {
  const { data: unreadData } = useGetUnreadNotificationCountQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  const { data: notificationsData } = useGetNotificationsQuery(
    { limit: 10 },
    {
      refetchInterval: 30000,
    }
  );
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();

  const unreadCount = unreadData?.unreadNotificationCount?.count ?? 0;
  const notifications = notificationsData?.notifications ?? [];

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await markReadMutation.mutateAsync({ notificationId });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllReadMutation.mutateAsync({});
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const getTypeColor = (type: string | null | undefined) => {
    switch (type) {
      case "error":
        return "text-destructive";
      case "warning":
        return "text-yellow-600 dark:text-yellow-500";
      case "success":
        return "text-green-600 dark:text-green-500";
      default:
        return "text-primary";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="relative" />}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                  !notification.read ? "bg-muted/50" : ""
                }`}
                render={
                  <Link
                    href={notification.link || "#"}
                    onClick={(e) => {
                      if (!notification.read && notification.id) {
                        handleMarkAsRead(notification.id, e);
                      }
                    }}
                  />
                }
              >
                <div className="flex w-full items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${getTypeColor(notification.type)}`}>
                    {notification.title}
                  </p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(notification.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {notification.message}
                </p>
                {!notification.read && (
                  <div className="h-2 w-2 rounded-full bg-primary mt-1" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
