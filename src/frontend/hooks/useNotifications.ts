"use client";

import { useCallback, useEffect, useState } from "react";
import { getNotifications, markAllNotificationsRead } from "../mocks/repository";
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
