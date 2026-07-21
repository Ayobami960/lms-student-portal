"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useListUsersQuery, useApproveInstructorMutation, useUpdateUserRoleMutation, useDeleteUserMutation } from "../../../../store/api/apiSlice";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Trash2, UserCheck, Clock } from "lucide-react";

const ROLES = ["STUDENT", "INSTRUCTOR", "ADMIN"] as const;

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

  if (isLoading) return <Skeleton className="mb-6 h-24 w-full" />;
  if (!pending?.length) return null;

  return (
    <div className="mb-6 card border-amber-200 dark:border-amber-900">
      <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-400">
        <Clock size={16} /> {pending.length} instructor{pending.length > 1 ? "s" : ""} awaiting approval
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {pending.map((u: any) => (
          <div key={u.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium">{u.name}</p>
              <p className="text-xs text-gray-500">{u.email} · Registered {new Date(u.createdAt).toLocaleDateString()}</p>
            </div>
            <button onClick={() => handleApprove(u.id, u.name)} disabled={approving} className="btn-primary">
              <UserCheck size={16} /> Approve
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<string>("");

  const { data, isLoading } = useListUsersQuery({ page, limit: 20, role: roleFilter || undefined });
  const [updateRole] = useUpdateUserRoleMutation();
  const [deleteUser] = useDeleteUserMutation();

  async function handleRoleChange(id: string, role: string) {
    try {
      await updateRole({ id, role }).unwrap();
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}?`)) return;
    try {
      await deleteUser(id).unwrap();
      toast.success("User deleted");
    } catch {
      toast.error("Failed to delete user");
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View, promote, approve, or remove platform users.</p>
        </div>
        <select className="input w-44" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <PendingInstructors />

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : !data?.data?.length ? (
        <EmptyState icon={Users} title="No users found" description="Try a different filter." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.data.map((u: any) => (
                <tr key={u.id} className="border-b border-gray-100 last:border-0 dark:border-gray-800">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-md border border-gray-200 bg-transparent px-2 py-1 text-xs dark:border-gray-700"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "INSTRUCTOR" ? (
                      u.isApproved ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400"><UserCheck size={12} /> Approved</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400"><Clock size={12} /> Pending</span>
                      )
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(u.id, u.name)}
                      className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      aria-label={`Delete ${u.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.pagination && (
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>Page {data.pagination.page} of {data.pagination.totalPages}</span>
          <div className="flex gap-2">
            <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
            <button className="btn-secondary" disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
