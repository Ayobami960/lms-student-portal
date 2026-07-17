import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Menu, Search, Bell, Moon, Sun } from "lucide-react";

interface TopbarProps {
  onOpenSidebar: () => void;
  currentTheme: string;
  onToggleTheme: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenSidebar, currentTheme, onToggleTheme }) => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/courses?search=${encodeURIComponent(trimmed)}`);
  }

  return (
    <header className="sticky top-0 z-30 flex justify-between items-center px-md py-xs w-full bg-surface-container-lowest/80 border-b border-outline-variant shadow-sm backdrop-blur-md transition-colors duration-200">
      <div className="flex items-center gap-md">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden text-primary p-1 hover:bg-surface-container rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>

        <form
          onSubmit={handleSearch}
          className="hidden md:flex items-center bg-surface-container border border-outline-variant rounded-full px-4 py-1.5 w-64 focus-within:border-primary transition-colors"
        >
          <Search className="w-4 h-4 text-outline mr-2 shrink-0" />
          <input
            className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm w-full text-on-surface placeholder:text-outline"
            placeholder="Search courses..."
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search courses"
          />
        </form>
      </div>

      <div className="flex items-center gap-sm">
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
          <Bell className="w-5 h-5" />
        </button>

        <button
          onClick={onToggleTheme}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
          aria-label="Toggle theme"
        >
          {currentTheme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        <div className="ml-2 w-10 h-10 rounded-full border-2 border-primary-container overflow-hidden">
          <img
            className="w-full h-full object-cover"
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
            alt="User Profile"
          />
        </div>
      </div>
    </header>
  );
};