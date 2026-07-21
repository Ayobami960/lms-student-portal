"use client";

import { Menu, Bell, LogOut, ChevronDown, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { toggleSidebar } from "../../store/uiSlice";
import { clearAuth } from "../../store/authSlice";
import { useLogoutMutation } from "../../store/api/apiSlice";
// import { ThemeToggle } from "../theme/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Turn "Jordan Alvarez" -> "JA", "Cher" -> "C", falls back to "?"
function getInitials(name?: string | null) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Topbar() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const router = useRouter();
  const [logout] = useLogoutMutation();

  async function handleLogout() {
    try {
      await logout().unwrap();
    } catch {
      /* ignore — clear local state regardless */
    }
    dispatch(clearAuth());
    router.push("/");
  }

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => dispatch(toggleSidebar())}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </Button>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        {/* <ThemeToggle /> */}

        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive ring-2 ring-background" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 data-[state=open]:bg-accent"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-sm font-semibold text-white">
                {getInitials(user?.name)}
              </div>
              <span className="hidden text-sm font-medium sm:block">{user?.name}</span>
              <ChevronDown size={14} className="hidden text-muted-foreground sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{user?.name}</span>
              <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User size={16} />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}