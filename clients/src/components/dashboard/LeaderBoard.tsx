import { ArrowUp, ArrowDown } from "lucide-react";

export interface LeaderboardEntry {
  rank: number;
  name: string;
  course: number;
  point: number;
  // The real /leaderboard endpoint doesn't return these yet — they're
  // optional so the row degrades gracefully (initials avatar, no trend
  // arrow, "—" for hours) until the backend adds them.
  trend?: "up" | "down";
  avatarUrl?: string;
  hour?: number;
}

interface LeaderBoardProps {
  entries: LeaderboardEntry[];
  /** id of the signed-in user's own leaderboard row, if any, to highlight it */
  currentUserRank?: number;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function LeaderBoard({ entries, currentUserRank }: LeaderBoardProps) {
  return (
    <div className="card p-6">
      <h3 className="mb-4 text-lg font-bold text-on-surface">Leader Board</h3>

      {!entries.length ? (
        <p className="text-sm text-on-surface-variant">
          Complete lessons and get assignments approved to appear on the leaderboard.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-[2.5rem_1fr_4rem_4rem_5rem] gap-4 px-2 pb-3 text-xs font-semibold uppercase tracking-wide text-on-surface-variant sm:grid-cols-[2.5rem_1fr_6rem_6rem_6rem]">
            <span>Rank</span>
            <span>Name</span>
            <span className="text-right">Course</span>
            <span className="text-right">Hour</span>
            <span className="text-right">Point</span>
          </div>

          <div className="divide-y divide-outline-variant">
            {entries.map((e) => (
              <div
                key={e.rank}
                className={`grid grid-cols-[2.5rem_1fr_4rem_4rem_5rem] items-center gap-4 px-2 py-3 sm:grid-cols-[2.5rem_1fr_6rem_6rem_6rem] ${
                  e.rank === currentUserRank ? "bg-secondary-container/30" : ""
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-container text-xs font-semibold text-on-surface">
                    {e.rank}
                  </span>
                  {e.trend === "up" && <ArrowUp size={14} className="text-success" />}
                  {e.trend === "down" && <ArrowDown size={14} className="text-error" />}
                </div>

                <div className="flex min-w-0 items-center gap-2.5">
                  {e.avatarUrl ? (
                    <img src={e.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container text-xs font-semibold text-on-surface">
                      {initials(e.name)}
                    </span>
                  )}
                  <span className="truncate text-sm font-medium text-on-surface">
                    {e.name}
                    {e.rank === currentUserRank && <span className="ml-1.5 text-xs text-secondary">(you)</span>}
                  </span>
                </div>

                <span className="text-right text-sm text-on-surface-variant">{e.course}</span>
                <span className="text-right text-sm text-on-surface-variant">{e.hour ?? "—"}</span>
                <span className="text-right text-sm font-semibold text-secondary">
                  {e.point.toLocaleString(undefined, { minimumFractionDigits: 3 })}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}