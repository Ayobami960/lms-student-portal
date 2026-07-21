"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import {
  useListUsersQuery,
  useApproveInstructorMutation,
  useUpdateUserRoleMutation,
  useDeleteUserMutation,
  useSetUserActiveMutation,
  useInviteAdminMutation,
  useListPendingInvitationsQuery,
} from "../../../../store/api/apiSlice";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, Trash2, UserCheck, Clock, Ban, UserPlus, Mail, ShieldCheck } from "lucide-react";

const ROLES = ["STUDENT", "INSTRUCTOR", "ADMIN"] as const;

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function roleBadgeClass(role: string) {
  switch (role) {
    case "ADMIN":
      return "border-primary/30 bg-primary-soft text-primary";
    case "INSTRUCTOR":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-400";
    default:
      return "border-border bg-secondary text-secondary-foreground";
  }
}

/* ------------------------------------------------------------------ */
/* Pending instructor approvals                                        */
/* ------------------------------------------------------------------ */

function PendingInstructors() {
  const { data, isLoading } = useListUsersQuery({ role: "INSTRUCTOR", pending: true, limit: 50 });
  const [approveInstructor, { isLoading: approving }] = useApproveInstructorMutation();
  const pending = data?.data;

  async function handleApprove(id: string, name: string) {
    try {
      await approveInstructor(id).unwrap();
      toast.success(`${name} approved — they can now access the dashboard`);
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to approve instructor");
    }
  }

  if (isLoading) return <Skeleton className="mb-6 h-20 w-full rounded-xl" />;
  if (!pending?.length) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-amber-200 dark:border-amber-900/60">
      <div className="flex items-center gap-2 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
        <Clock size={15} />
        {pending.length} instructor{pending.length > 1 ? "s" : ""} awaiting approval
      </div>
      <div className="divide-y divide-border bg-card">
        {pending.map((u: any) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                {initials(u.name)}
              </div>
              <div>
                <p className="text-sm font-medium leading-none">{u.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {u.email} · Registered {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button size="sm" onClick={() => handleApprove(u.id, u.name)} disabled={approving}>
              <UserCheck size={14} /> Approve
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Invite admin                                                        */
/* ------------------------------------------------------------------ */

const inviteSchema = z.object({ email: z.string().email("Enter a valid email address") });
type InviteForm = z.infer<typeof inviteSchema>;

function InviteAdminDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteForm>({ resolver: zodResolver(inviteSchema) });
  const [inviteAdmin, { isLoading }] = useInviteAdminMutation();

  async function onSubmit(values: InviteForm) {
    try {
      await inviteAdmin(values).unwrap();
      toast.success(`Invitation sent to ${values.email}`);
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.data?.message ?? "Failed to send invitation");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary">
            <ShieldCheck size={18} />
          </div>
          <DialogTitle>Invite a new admin</DialogTitle>
          <DialogDescription>
            We&apos;ll email a secure invitation link. It expires in 48 hours and lets them set their own password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="name@example.com"
              autoFocus
              {...register("email")}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Mail size={14} /> {isLoading ? "Sending…" : "Send invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PendingInvitations() {
  const { data } = useListPendingInvitationsQuery();
  const invitations = data?.data;
  if (!invitations?.length) return null;

  return (
    <div className="mb-6 rounded-xl border border-border bg-card p-4">
      <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
        <Mail size={14} className="text-muted-foreground" />
        Pending admin invitations
      </p>
      <div className="divide-y divide-border">
        {invitations.map((i: any) => (
          <div key={i.id} className="flex items-center justify-between py-2 text-sm">
            <span className="text-foreground">{i.email}</span>
            <span className="text-xs text-muted-foreground">
              Expires {new Date(i.expiresAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pagination bar                                                       */
/* ------------------------------------------------------------------ */

function pageRange(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = Array.from(pages).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - (sorted[i - 1] as number) > 1) out.push("ellipsis");
    out.push(p);
  });
  return out;
}

function UsersPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={page <= 1}
            className={page <= 1 ? "pointer-events-none opacity-40" : ""}
            onClick={(e) => {
              e.preventDefault();
              if (page > 1) onPageChange(page - 1);
            }}
          />
        </PaginationItem>
        {pageRange(page, totalPages).map((p, i) =>
          p === "ellipsis" ? (
            <PaginationItem key={`e-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                href="#"
                isActive={p === page}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(p);
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
            aria-disabled={page >= totalPages}
            className={page >= totalPages ? "pointer-events-none opacity-40" : ""}
            onClick={(e) => {
              e.preventDefault();
              if (page < totalPages) onPageChange(page + 1);
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                  */
/* ------------------------------------------------------------------ */

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showInvite, setShowInvite] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const [pendingToggle, setPendingToggle] = useState<{ id: string; name: string; active: boolean } | null>(null);

  const { data, isLoading } = useListUsersQuery({
    page,
    limit: 20,
    role: roleFilter === "all" ? undefined : roleFilter,
  });
  const [updateRole] = useUpdateUserRoleMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [setUserActive] = useSetUserActiveMutation();

  async function handleRoleChange(id: string, role: string) {
    try {
      await updateRole({ id, role }).unwrap();
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  }

  async function confirmToggleActive() {
    if (!pendingToggle) return;
    const { id, name, active } = pendingToggle;
    const action = active ? "deactivate" : "activate";
    try {
      await setUserActive({ id, isActive: !active }).unwrap();
      toast.success(`${name} ${action}d`);
    } catch (e: any) {
      toast.error(e?.data?.message ?? `Failed to ${action} user`);
    } finally {
      setPendingToggle(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const { id, name } = pendingDelete;
    try {
      await deleteUser(id).unwrap();
      toast.success("User deleted");
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manage Users</h1>
          <p className="text-sm text-muted-foreground">
            View, promote, approve, activate, or remove platform users.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r}>
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowInvite(true)}>
            <UserPlus size={15} /> Invite admin
          </Button>
        </div>
      </div>

      <PendingInstructors />
      <PendingInvitations />

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : !data?.data?.length ? (
        <EmptyState icon={Users} title="No users found" description="Try a different filter." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((u: any) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                        {initials(u.name)}
                      </div>
                      <div>
                        <p className="font-medium leading-none">{u.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)}>
                      <SelectTrigger className={`h-8 w-36 text-xs ${roleBadgeClass(u.role)}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r.charAt(0) + r.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {u.role === "INSTRUCTOR" &&
                        (u.isApproved ? (
                          <Badge className="border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400">
                            <UserCheck size={11} /> Approved
                          </Badge>
                        ) : (
                          <Badge className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-400">
                            <Clock size={11} /> Pending
                          </Badge>
                        ))}
                      {u.isActive === false && (
                        <Badge variant="destructive">
                          <Ban size={11} /> Deactivated
                        </Badge>
                      )}
                      {u.role !== "INSTRUCTOR" && u.isActive !== false && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={u.isActive === false ? "text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/20" : "text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/20"}
                        onClick={() =>
                          setPendingToggle({ id: u.id, name: u.name, active: u.isActive !== false })
                        }
                        aria-label={u.isActive === false ? `Activate ${u.name}` : `Deactivate ${u.name}`}
                        title={u.isActive === false ? "Activate" : "Deactivate"}
                      >
                        {u.isActive === false ? <UserCheck size={16} /> : <Ban size={16} />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setPendingDelete({ id: u.id, name: u.name })}
                        aria-label={`Delete ${u.name}`}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </p>
          <UsersPagination page={page} totalPages={data.pagination.totalPages} onPageChange={setPage} />
        </div>
      )}

      <InviteAdminDialog open={showInvite} onOpenChange={setShowInvite} />

      {/* Deactivate / activate confirmation */}
      <AlertDialog open={!!pendingToggle} onOpenChange={(v) => !v && setPendingToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingToggle?.active ? "Deactivate" : "Activate"} {pendingToggle?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingToggle?.active
                ? "They'll immediately lose access to the platform until reactivated."
                : "They'll regain access to the platform right away."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggleActive}>
              {pendingToggle?.active ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(v) => !v && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes their account and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}