"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} from "@/store/api/apiSlice";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type FilterTab = "all" | "unread";

const NotificationsPage = () => {
  const [filter, setFilter] = useState<FilterTab>("all");

  const { data, isLoading } = useListNotificationsQuery(undefined, {
    pollingInterval: 30_000,
  });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] =
    useMarkAllNotificationsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const allNotifications = data?.data?.notifications ?? [];
  const unreadCount = data?.data?.unreadCount ?? 0;

  const notifications =
    filter === "unread"
      ? allNotifications.filter((n: any) => !n.read)
      : allNotifications;

  return (
    <div className="p-4 mx-auto w-full ">
      <Card className="border-border shadow-sm bg-white dark:bg-card rounded-lg overflow-hidden">
        <CardHeader className="border-b border-border bg-slate-50/50 dark:bg-muted/20 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black uppercase tracking-tight">
                  Notifications
                </CardTitle>
                <CardDescription className="text-sm font-medium mt-1">
                  {unreadCount > 0
                    ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`
                    : "You're all caught up."}
                </CardDescription>
              </div>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllRead()}
                disabled={isMarkingAll}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 mt-5">
            {(["all", "unread"] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  filter === tab
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-slate-100 dark:hover:bg-muted"
                }`}
              >
                {tab === "all" ? "All" : "Unread"}
                {tab === "unread" && unreadCount > 0 && (
                  <span className="ml-1.5">({unreadCount})</span>
                )}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-3">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-24">
              <EmptyState
                icon={Bell}
                title={filter === "unread" ? "No unread notifications" : "No notifications yet"}
                description={
                  filter === "unread"
                    ? "You're all caught up — nothing new to read."
                    : "Updates and alerts will show up here as they happen."
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.map((n: any) => {
                const rowContent = (
                  <div
                    className={`flex items-start gap-3 px-6 py-4 transition-colors ${
                      !n.read
                        ? "bg-primary/5 hover:bg-primary/10"
                        : "hover:bg-slate-50 dark:hover:bg-muted/30"
                    }`}
                  >
                    {/* Unread dot */}
                    <div className="pt-1.5">
                      <span
                        className={`block w-2 h-2 rounded-full ${
                          !n.read ? "bg-primary" : "bg-transparent"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {n.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {n.message}
                      </p>
                      <p className="text-xs text-slate-400 mt-1.5 font-medium">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      {!n.read && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            markRead(n.id);
                          }}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
                          aria-label="Mark as read"
                        >
                          <Check size={15} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          deleteNotification(n.id);
                        }}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-800"
                        aria-label="Delete notification"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );

                return n.link ? (
                  <Link
                    key={n.id}
                    href="/inbox"
                    onClick={() => {
                      if (!n.read) markRead(n.id);
                    }}
                    className="block"
                  >
                    {rowContent}
                  </Link>
                ) : (
                  <div key={n.id}>{rowContent}</div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;