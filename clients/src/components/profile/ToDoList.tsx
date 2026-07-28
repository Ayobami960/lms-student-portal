import { Check, Trash2 } from "lucide-react";

export interface TodoSubtask {
  id: string;
  title: string;
  done: boolean;
}

export interface TodoItem {
  id: string;
  title: string;
  category: string;
  time: string;
  done: boolean;
  subtasks?: TodoSubtask[];
}

interface TodoListProps {
  items: TodoItem[];
  onToggle: (id: string, subtaskId?: string) => void;
  onDelete?: (id: string) => void;
}

function TaskCheckbox({ done, onClick }: { done: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={done}
      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
        done ? "bg-secondary border-secondary" : "border-outline bg-surface-container-lowest"
      }`}
    >
      {done && <Check size={13} strokeWidth={3} className="text-on-secondary" />}
    </button>
  );
}

export function TodoList({ items, onToggle, onDelete }: TodoListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-on-surface-variant">Nothing on your list yet.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <div key={item.id}>
          <div className="group flex items-start gap-3">
            <TaskCheckbox done={item.done} onClick={() => onToggle(item.id)} />
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm font-semibold ${
                  item.done ? "text-on-surface-variant line-through" : "text-on-surface"
                }`}
              >
                {item.title}
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                {item.category} <span className="text-accent font-medium">| {item.time}</span>
              </p>
            </div>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                aria-label="Delete task"
                className="opacity-0 transition-opacity group-hover:opacity-100 text-on-surface-variant hover:text-error"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {item.subtasks && item.subtasks.length > 0 && (
            <div className="ml-8 mt-3 flex flex-col gap-3 border-l border-outline-variant pl-4">
              {item.subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-3">
                  <TaskCheckbox done={sub.done} onClick={() => onToggle(item.id, sub.id)} />
                  <span
                    className={`text-sm ${
                      sub.done ? "text-on-surface-variant line-through" : "text-on-surface"
                    }`}
                  >
                    {sub.title}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}