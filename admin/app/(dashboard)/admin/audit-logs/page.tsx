"use client";

import { useState } from "react";
import { useListAuditLogsQuery, useListAuditActionsQuery } from "@/store/api/apiSlice";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { formatDistanceToNow } from "date-fns";
import { ScrollText, Clock } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "text-primary-600 dark:text-primary-400",
  INSTRUCTOR: "text-amber-600 dark:text-amber-400",
  STUDENT: "text-gray-600 dark:text-gray-400",
};

// shadcn's Select doesn't allow an empty-string item value, so we use
// "all" as the sentinel for "no filter" and translate it at the query boundary.
const ALL_ACTIONS = "all";

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  const delta = 1;
  const pages: (number | "ellipsis")[] = [];

  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis");
    }
  }

  return pages;
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState(ALL_ACTIONS);

  const { data, isLoading } = useListAuditLogsQuery({
    page,
    limit: 25,
    action: actionFilter === ALL_ACTIONS ? undefined : actionFilter,
  });
  const { data: actionsRes } = useListAuditActionsQuery();

  const totalPages = data?.pagination?.totalPages || 1;
  const currentPage = data?.pagination?.page || page;

  return (
    <div className="p-4 mx-auto w-full">
      <Card className="border-border shadow-sm bg-white dark:bg-card rounded-lg overflow-hidden h-[96vh]">
        <CardHeader className="border-b border-border bg-slate-50/50 dark:bg-muted/20 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <ScrollText className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black uppercase tracking-tight">
                  Audit Logs
                </CardTitle>
                <CardDescription className="text-sm font-medium mt-1">
                  A record of important actions taken across the platform.
                </CardDescription>
              </div>
            </div>

            <Select
              value={actionFilter}
              onValueChange={(value) => {
                setActionFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_ACTIONS}>All actions</SelectItem>
                {actionsRes?.data?.map((a: string) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : !data?.data?.length ? (
            <div className="py-24">
              <EmptyState
                icon={ScrollText}
                title="No audit entries yet"
                description="Actions like role changes, deletions, and status changes will show up here."
              />
            </div>
          ) : (
            <ScrollArea className="h-[96vh] w-full p-6">
              <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 space-y-8 pb-8">
                {data.data.map((log: any) => (
                  <div
                    key={log.id}
                    className="relative pl-8 animate-in fade-in slide-in-from-bottom-2 duration-500"
                  >
                    {/* Timeline Dot */}
                    <div className="absolute -left-2.25 top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-white dark:ring-card shadow-sm" />

                    <div className="flex flex-col gap-1">
                      {/* Top Row: Action badge & timestamp */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-xs font-semibold">
                            {log.action}
                          </code>
                          <span
                            className={`text-xs font-semibold ${
                              ROLE_COLORS[log.actorRole] ?? "text-gray-500"
                            }`}
                          >
                            {log.actorName}
                          </span>
                        </div>

                        <div className="flex items-center text-xs font-semibold text-muted-foreground shrink-0 bg-slate-100 dark:bg-muted px-2.5 py-1 rounded-md">
                          <Clock className="w-3 h-3 mr-1.5" />
                          {log.createdAt
                            ? formatDistanceToNow(new Date(log.createdAt), {
                                addSuffix: true,
                              })
                            : "Unknown time"}
                        </div>
                      </div>

                      {/* Description box */}
                      {log.description && (
                        <div className="mt-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-600 dark:text-slate-400 font-medium">
                          {log.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* shadcn/ui Pagination */}
              {totalPages > 1 && (
                <div className="pt-4 pb-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setPage(currentPage - 1);
                          }}
                          className={
                            currentPage === 1 || isLoading
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>

                      {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                        p === "ellipsis" ? (
                          <PaginationItem key={`ellipsis-${idx}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={p}>
                            <PaginationLink
                              href="#"
                              isActive={p === currentPage}
                              onClick={(e) => {
                                e.preventDefault();
                                setPage(p);
                              }}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}

                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) setPage(currentPage + 1);
                          }}
                          className={
                            currentPage === totalPages || isLoading
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}