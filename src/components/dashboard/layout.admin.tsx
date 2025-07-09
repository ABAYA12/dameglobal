"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  DollarSign,
  BarChart3,
  Settings,
  Database,
  Shield,
  Bell,
  Search,
  Plus,
  Menu,
  LogOut,
  Crown,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

interface AdminDashboardLayoutProps {
  children: ReactNode;
}

const adminNavigation = [
  {
    name: "System Overview",
    href: "/dashboard/admin",
    icon: LayoutDashboard,
  },
  {
    name: "User Management",
    href: "/dashboard/admin/users",
    icon: Users,
  },
  {
    name: "Case Management",
    href: "/dashboard/admin/cases",
    icon: FolderOpen,
  },
  {
    name: "Financial Dashboard",
    href: "/dashboard/admin/financial",
    icon: DollarSign,
  },
  {
    name: "Analytics & Reports",
    href: "/dashboard/admin/analytics",
    icon: BarChart3,
  },
  {
    name: "Data Management",
    href: "/dashboard/admin/data",
    icon: Database,
  },
  {
    name: "Security",
    href: "/dashboard/admin/security",
    icon: Shield,
  },
  {
    name: "System Settings",
    href: "/dashboard/admin/settings",
    icon: Settings,
  },
];

export default function AdminDashboardLayout({ children }: AdminDashboardLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="border-b bg-white">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="font-bold text-xl text-red-600">
              Demaeks Global - Admin
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search users, cases, system..."
                className="w-64 pl-10"
              />
            </div>

            {/* Quick Actions */}
            <Button size="sm" className="hidden md:flex">
              <Plus className="mr-2 h-4 w-4" />
              Quick Action
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
                5
              </Badge>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                    <Crown className="h-4 w-4 text-red-600" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session?.user?.name ?? "System Administrator"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email}
                    </p>
                    <Badge variant="destructive" className="w-fit text-xs">
                      Admin
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-64 border-r bg-white md:block">
          <nav className="space-y-1 p-4">
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-100",
                    isActive
                      ? "bg-red-50 text-red-700"
                      : "text-gray-700"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
