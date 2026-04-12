"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Cpu, Activity, LayoutTemplate, ShieldAlert, LogOut, Settings } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { getStoredUser, isAuthenticated, logout } from "@/lib/api";

const navItems = [
  { 
    name: "Overview", 
    href: "/dashboard", 
    icon: <LayoutDashboard className="w-5 h-5" /> 
  },

  { 
    name: "AI VLSI Design", 
    href: "/dashboard/design", 
    icon: <Cpu className="w-5 h-5" /> 
  },

  { 
    name: "Simulation", 
    href: "/dashboard/simulation", 
    icon: <Activity className="w-5 h-5" /> 
  },

  { 
    name: "Optimization", 
    href: "/dashboard/optimization", 
    icon: <LayoutTemplate className="w-5 h-5" /> 
  },

  { 
    name: "Semiconductor SaaS", 
    href: "/dashboard/semiconductor", 
    icon: <ShieldAlert className="w-5 h-5" /> 
  }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Auth guard: redirect to login if not authenticated
    if (!isAuthenticated()) {
      router.replace("/login");
      return;
    }
    
    const storedUser = getStoredUser();
    setUser(storedUser);
    setChecked(true);
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Show nothing while checking auth (prevents flash of dashboard)
  if (!checked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-500 animate-pulse">Loading...</div>
      </div>
    );
  }

  // Derive display name and initials from stored user
  const displayName = user?.name || "Engineer";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "EN";

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-950/80 backdrop-blur-xl flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2 scale-[0.6] origin-left">
            <Logo className="w-64 h-24 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start gap-3 h-12 text-slate-300 hover:text-white hover:bg-slate-800/50 ${isActive ? "bg-slate-800/80 text-cyan-400 border-l-2 border-cyan-400 rounded-l-none" : ""}`}
                >
                  {item.icon}
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link href="/dashboard/profile" className={buttonVariants({ variant: "ghost", className: `w-full justify-start gap-3 h-10 ${pathname === '/dashboard/profile' ? 'bg-slate-800/80 text-cyan-400' : 'text-slate-400 hover:text-white'}` })}>
              <Settings className="w-5 h-5" />
              Profile & Settings
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-10 text-red-400 hover:text-red-300 hover:bg-red-400/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-fixed">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-md">
          <h2 className="text-lg font-semibold text-slate-200">
            {navItems.find(item => item.href === pathname)?.name || "Dashboard"}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-400 hidden sm:block">Welcome, {displayName}</div>
            <Link href="/dashboard/profile">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-cyan-500/50 flex items-center justify-center text-sm font-bold text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)] cursor-pointer hover:border-cyan-400 transition-colors">
                {initials}
              </div>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
