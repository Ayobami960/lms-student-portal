import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MiniCalendarProps {
  selected: Date;
  onSelect: (date: Date) => void;
}

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export function MiniCalendar({ selected, onSelect }: MiniCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(selected));

  const weekDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart]
  );

  const monthLabel = weekDates[0].toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const shiftWeek = (dir: -1 | 1) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + dir * 7);
    setWeekStart(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => shiftWeek(-1)}
          aria-label="Previous week"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-on-surface">{monthLabel}</span>
        <button
          type="button"
          onClick={() => shiftWeek(1)}
          aria-label="Next week"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center">
        {DAY_LETTERS.map((letter, i) => (
          <span key={`${letter}-${i}`} className="text-xs font-medium text-on-surface-variant">
            {letter}
          </span>
        ))}

        {weekDates.map((date) => {
          const isSelected = isSameDay(date, selected);
          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelect(date)}
              className={`mx-auto w-8 h-8 rounded-full text-sm flex items-center justify-center transition-colors ${
                isSelected
                  ? "bg-primary text-on-primary ring-2 ring-accent ring-offset-2 ring-offset-surface-container-lowest font-semibold"
                  : "text-on-surface hover:bg-surface-container"
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}