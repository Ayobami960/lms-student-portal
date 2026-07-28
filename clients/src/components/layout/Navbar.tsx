import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Menu, Search, Bell, Moon, Sun, X } from "lucide-react";

import { useAppSelector } from "../../hooks/redux";
import { Button } from "../ui/Button";

interface TopbarProps {
  onOpenSidebar: () => void;
  onOpenProfile: () => void;
  currentTheme: string;
  onToggleTheme: () => void;
}

const FALLBACK_AVATAR =
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=200&q=80";

export const Navbar: React.FC<TopbarProps> = ({ onOpenSidebar, currentTheme, onOpenProfile, onToggleTheme }) => {
  const [query, setQuery] = useState("");
  const [navbarOption, setNavbarOption] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    if (navbarOption) mobileInputRef.current?.focus();
  }, [navbarOption]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/courses?search=${encodeURIComponent(trimmed)}`);
    setNavbarOption(false);
  }

  return (
    <header className="sticky top-0 z-30 flex w-full items-center justify-between gap-md border-b border-outline-variant bg-surface-container-lowest/80 px-md py-xs shadow-sm backdrop-blur-md transition-colors duration-200">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .navbar-search-expand {
            animation: navbar-expand 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        }
        @keyframes navbar-expand {
          from { opacity: 0; transform: scaleX(0.9); }
          to { opacity: 1; transform: scaleX(1); }
        }
      `}</style>

      {/* Left side: sidebar toggle + desktop search (hidden while mobile search is open) */}
      {!navbarOption && (
        <div className="flex items-center gap-md">
          <button
            onClick={onOpenSidebar}
            className="rounded-lg p-1 text-primary hover:bg-surface-container lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>

          <form onSubmit={handleSearch} className="relative hidden w-64 md:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses..."
              aria-label="Search courses"
              className="input-search"
            />
          </form>
        </div>
      )}

      {/* Mobile search: expands to fill the header when open */}
      {navbarOption && (
        <form
          onSubmit={handleSearch}
          className="navbar-search-expand flex flex-1 origin-left items-center gap-2 md:hidden"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
            <input
              ref={mobileInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses..."
              aria-label="Search courses"
              className="input-search"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setNavbarOption(false)}
            aria-label="Close search"
            className="h-12 w-12 shrink-0 rounded-full px-0"
          >
            <X className="h-6 w-6" />
          </Button>
        </form>
      )}

      {/* Right side: actions (hidden while mobile search is open, except the search toggle itself) */}
      <div className="flex items-center gap-sm">
        {!navbarOption && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setNavbarOption(true)}
            aria-label="Open search"
            className="h-12 w-12 shrink-0 rounded-full px-0 md:hidden"
          >
            <Search className="h-6 w-6" />
          </Button>
        )}

        {!navbarOption && (
          <>
            <Button
              type="button"
              variant="ghost"
              aria-label="Notifications"
              className="h-12 w-12 shrink-0 rounded-full px-0"
            >
              <Bell className="h-6 w-6" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className="h-12 w-12 shrink-0 rounded-full px-0"
            >
              {currentTheme === "light" ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
            </Button>


            <button
              type="button"
              onClick={onOpenProfile}
              aria-label="Open profile panel"
              className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-outline-variant transition-colors hover:border-primary lg:hidden"
            >
              <img
                src={user?.avatar || FALLBACK_AVATAR}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          </>
        )}
      </div>
    </header>
  );
};