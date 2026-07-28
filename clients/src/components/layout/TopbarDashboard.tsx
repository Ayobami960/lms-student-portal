import { useState, useEffect } from "react";
import { useAppSelector } from "../../hooks/redux";

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export const TopbarDashboard = () => {
 
  

  const user = useAppSelector((s) => s.auth.user);
  const isInstructor = user?.role === "INSTRUCTOR";
  const now = useClock();

  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const dateShort = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });



  return (
    <header
      className="topbar-banner relative overflow-hidden rounded-[1.5rem] px-5 py-5 sm:px-8 sm:py-6"
      style={{
        background:
          "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%)",
        backgroundSize: "200% 200%",
      }}
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .topbar-banner { animation: topbar-sheen 14s ease-in-out infinite; }
          .topbar-item {
            opacity: 0;
            animation: topbar-rise 0.55s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .topbar-clock-dot { animation: topbar-pulse 2.2s ease-in-out infinite; }
          .topbar-notif-dot { animation: topbar-pulse 2.2s ease-in-out infinite; }
          .topbar-search-panel w-full {
            animation: topbar-expand 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        }
        @keyframes topbar-sheen {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes topbar-rise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes topbar-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.35); opacity: 0.6; }
        }
        @keyframes topbar-expand {
          from { opacity: 0; transform: scaleX(0.85); }
          to { opacity: 1; transform: scaleX(1); }
        }
        .topbar-btn {
          transition: transform 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
        }
        .topbar-btn:hover { transform: translateY(-1px); }
        .topbar-btn:active { transform: translateY(0) scale(0.96); }
      `}</style>

      {/* faint corner glow */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-20 blur-3xl"
        style={{ background: "var(--color-secondary)" }}
      />

      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Greeting */}
        <div className="topbar-item" style={{ animationDelay: "0ms" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-on-primary/50">
            <span className="sm:hidden">{dateShort}</span>
            <span className="hidden sm:inline">{date}</span>
          </p>
          {isInstructor ? (
            <>
              <h1 className="mt-1 text-lg font-bold text-on-primary sm:text-2xl">
                Welcome back, {user?.name ?? "there"}
              </h1>
              <p className="mt-1 text-sm text-on-primary/70">
                Your students are waiting — let's build something great today.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-1 text-lg font-bold text-on-primary sm:text-2xl">
                Hello, {user?.name ?? "there"}
              </h1>
              <p className="mt-1 text-sm text-on-primary/70">
                Let's learn something new today.
              </p>
            </>
          )}
        </div>

        {/* Actions + clock */}
        <div className="flex flex-wrap items-center gap-3 lg:gap-4">
         

         

        
            <>
              {/* Live clock */}
              <div
                className="topbar-item flex shrink-0 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-sm"
                style={{ animationDelay: "200ms" }}
              >
                <span
                  className="topbar-clock-dot h-2 w-2 rounded-full"
                  style={{ background: "var(--color-secondary)", boxShadow: "0 0 8px var(--color-secondary)" }}
                  aria-hidden
                />
                <div className="leading-tight">
                  <p
                    className="font-semibold text-on-primary tabular-nums"
                    style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}
                    aria-label={`Current time ${time}`}
                  >
                    {time}
                  </p>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-on-primary/45">
                    Local
                  </p>
                </div>
              </div>
            </>
        
        </div>
      </div>
    </header>
  );
};