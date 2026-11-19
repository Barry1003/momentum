"use client";

import { useCallback, useEffect, useState } from "react";
import { getNotifications, markAllNotificationsRead } from "../api/liveRepository";
import type { NotificationItem } from "../mocks/types";

export interface UseNotificationsResult {
  items: NotificationItem[];
  isLoading: boolean;
  unreadCount: number;
  markAllRead: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getNotifications()
      .then((result) => {
        if (isMounted) setItems(result);
      })
      .catch(() => undefined)
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const markAllRead = useCallback(async () => {
    setItems(await markAllNotificationsRead());
  }, []);

  return { items, isLoading, unreadCount: items.filter((item) => !item.isRead).length, markAllRead };
}
