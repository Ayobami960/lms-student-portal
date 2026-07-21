"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useListCoursesQuery, useRemoveCourseMutation } from "../../../store/api/apiSlice";

import { EmptyState } from "@/components/EmptyState";
import { BookOpen, Trash2, Pencil, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

function getPageList(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const withEllipsis: (number | "ellipsis")[] = [];
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) withEllipsis.push("ellipsis");
    withEllipsis.push(page);
  });
  return withEllipsis;
}

export default function AdminCoursesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListCoursesQuery({ page, limit: 15 });
  const [removeCourse] = useRemoveCourseMutation();

  async function handleRemove(id: string, title: string) {
    if (!confirm(`Remove "${title}"?`)) return;
    try {
      await removeCourse(id).unwrap();
      toast.success("Course removed");
    } catch {
      toast.error("Failed to remove course");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 text-2xl font-bold text-foreground">All Courses</h1>
          <p className="text-sm text-muted-foreground">Platform-wide course oversight.</p>
        </div>
        <Button asChild>
          <Link href="/courses/new">
            <Plus size={16} /> New course
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : !data?.data?.length ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          action={
            <Button asChild>
              <Link href="/courses/new">New course</Link>
            </Button>
          }
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Instructor</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Students</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.data.map((c: any) => (
                <tr
                  key={c.id}
                  className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/50"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link href={`/courses/${c.id}`} className="hover:underline">
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.instructor?.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.category}</td>
                  <td className="px-4 py-3">
                    <Badge variant={c.published ? "success" : "warning"}>
                      {c.published ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c._count?.enrollments ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild aria-label={`Edit ${c.title}`}>
                        <Link href={`/courses/${c.id}`}>
                          <Pencil size={16} />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(c.id, c.title)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Delete ${c.title}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.pagination && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>

          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={page <= 1}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage((p) => p - 1);
                  }}
                />
              </PaginationItem>

              {getPageList(page, data.pagination.totalPages).map((p, i) =>
                p === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === page}
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
                  aria-disabled={page >= data.pagination.totalPages}
                  className={page >= data.pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < data.pagination.totalPages) setPage((p) => p + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}