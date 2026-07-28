import { useMemo, useState } from "react";
import { BadgeCheck, Pencil, Plus, X } from "lucide-react";
import { useAppSelector } from "../../hooks/redux";
import { TodoList } from "./ToDoList";
import { MiniCalendar } from "../MiniCalendar";
import { EditProfileModal } from "./EditProfileModal";
import {
  useListTodosQuery,
  useCreateTodoMutation,
  useUpdateTodoMutation,
  useDeleteTodoMutation,
} from "../../store/api/apiSlice";

interface ProfilePanelProps {
  open: boolean;
  onClose: () => void;
}

export function ProfilePanel({ open, onClose }: ProfilePanelProps) {
  const user = useAppSelector((s) => s.auth.user);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [newTodoTitle, setNewTodoTitle] = useState("");

  const { data: todosRes } = useListTodosQuery();
  const [createTodo, { isLoading: creating }] = useCreateTodoMutation();
  const [updateTodo] = useUpdateTodoMutation();
  const [deleteTodo] = useDeleteTodoMutation();

  const avatar =
    user?.avatar ||
    "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=200&q=80";

  const todoItems = useMemo(
    () =>
      (todosRes?.data ?? []).map((t: any) => ({
        id: t.id,
        title: t.title,
        category: t.category || "General",
        time: t.dueAt
          ? new Date(t.dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : "No due date",
        done: t.completed,
      })),
    [todosRes]
  );

  function handleToggle(id: string) {
    const current = todoItems.find((t) => t.id === id);
    if (!current) return;
    updateTodo({ id, completed: !current.done });
  }

  function handleDelete(id: string) {
    deleteTodo(id);
  }

  async function handleAddTodo(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newTodoTitle.trim();
    if (!trimmed) return;
    await createTodo({ title: trimmed });
    setNewTodoTitle("");
  }

  const editButton = (
    <button
      onClick={() => setEditOpen(true)}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface"
      aria-label="Edit profile"
    >
      <Pencil size={16} />
    </button>
  );

  const body = (
    <>
      <div className="mt-6 flex flex-col items-center text-center">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full p-1"
          style={{ background: "conic-gradient(from 180deg, var(--color-tertiary), var(--color-accent), var(--color-tertiary))" }}
        >
          <img
            src={avatar}
            alt=""
            className="h-full w-full rounded-full border-4 border-surface-container-lowest object-cover"
          />
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          <span className="font-bold text-on-surface">{user?.name ?? "Student"}</span>
          <BadgeCheck size={16} className="fill-success text-on-success" />
        </div>
        <p className="text-sm text-on-surface-variant">
          {user?.role === "INSTRUCTOR" ? "Instructor" : "Student"}
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-outline-variant p-4">
        <MiniCalendar selected={selectedDate} onSelect={setSelectedDate} />
      </div>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-bold text-on-surface">To Do List</h3>

        <form onSubmit={handleAddTodo} className="mb-4 flex items-center gap-2">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="Add a task..."
            className="input h-9 flex-1 text-sm"
          />
          <button
            type="submit"
            disabled={creating || !newTodoTitle.trim()}
            aria-label="Add task"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
        </form>

        <TodoList items={todoItems} onToggle={handleToggle} onDelete={handleDelete} />
      </div>
    </>
  );

  return (
    <>
      {/* desktop view */}
      <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-outline-variant bg-surface-container-lowest p-6 xl:block">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-on-surface">Profile</h2>
          {editButton}
        </div>
        {body}
      </aside>

      {/* mobile view */}
      {open && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />

          <aside className="absolute right-0 top-0 z-50 h-full w-72 overflow-y-auto bg-surface-container-lowest p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface">Profile</h2>
              <div className="flex items-center gap-1">
                {editButton}
                <button
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                  onClick={onClose}
                  aria-label="Close profile panel"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            {body}
          </aside>
        </div>
      )}

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} user={user} />
    </>
  );
}