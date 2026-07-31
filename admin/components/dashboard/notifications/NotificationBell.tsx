"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} from "@/store/api/apiSlice";

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}


const PREVIEW_LIMIT = 6;

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useListNotificationsQuery(undefined, { pollingInterval: 30_000 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const notifications = data?.data?.notifications ?? [];
  const unreadCount = data?.data?.unreadCount ?? 0;
  const previewNotifications = notifications.slice(0, PREVIEW_LIMIT);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={() => markAllRead()} className="flex items-center gap-1 text-xs text-primary-600 hover:underline">
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {previewNotifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-400">You're all caught up.</p>
            ) : (
              previewNotifications.map((n: any) => {
                const content = (
                  <div className={`flex items-start gap-2 px-4 py-3 text-sm ${!n.read ? "bg-primary-50/50 dark:bg-primary-900/10" : ""}`}>
                    <div className="flex-1">
                      <p className="font-medium">{n.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{n.message}</p>
                      <p className="mt-1 text-[11px] text-gray-400">{timeAgo(n.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {!n.read && (
                        <button
                          onClick={(e) => { e.preventDefault(); markRead(n.id); }}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-primary-600 dark:hover:bg-gray-800"
                          aria-label="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.preventDefault(); deleteNotification(n.id); }}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800"
                        aria-label="Delete notification"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
                return (
                  <Link
                    key={n.id}
                    href="/notifications"
                    onClick={() => { setOpen(false); if (!n.read) markRead(n.id); }}
                    className="block border-b border-gray-50 last:border-0 hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-gray-800/50"
                  >
                    {content}
                  </Link>
                );
              })
            )}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-gray-100 px-4 py-2.5 text-center text-xs font-semibold text-primary-600 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}