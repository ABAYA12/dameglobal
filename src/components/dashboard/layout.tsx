"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";

interface DashboardLayoutProps {
  children: ReactNode;
  userRole?: string;
}

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const user = session.user;
  const role = userRole || user.role;

  const getNavigationItems = () => {
    const baseItems = [
      { name: "Dashboard", href: `/dashboard/${role.toLowerCase()}` },
    ];

    switch (role) {
      case "CLIENT":
        return [
          ...baseItems,
          { name: "My Cases", href: "/dashboard/client/cases" },
          { name: "File New Case", href: "/dashboard/client/cases/new" },
          { name: "Documents", href: "/dashboard/client/documents" },
          { name: "Messages", href: "/dashboard/client/messages" },
          { name: "Payments", href: "/dashboard/client/payments" },
        ];
      case "STAFF":
        return [
          ...baseItems,
          { name: "Assigned Cases", href: "/dashboard/staff/cases" },
          { name: "All Cases", href: "/dashboard/staff/cases/all" },
          { name: "Documents", href: "/dashboard/staff/documents" },
          { name: "Messages", href: "/dashboard/staff/messages" },
          { name: "Tickets", href: "/dashboard/staff/tickets" },
        ];
      case "LEGAL":
        return [
          ...baseItems,
          { name: "Legal Cases", href: "/dashboard/legal/cases" },
          { name: "Documents", href: "/dashboard/legal/documents" },
          { name: "Messages", href: "/dashboard/legal/messages" },
          { name: "Legal Library", href: "/dashboard/legal/library" },
        ];
      case "ADMIN":
        return [
          ...baseItems,
          { name: "All Cases", href: "/dashboard/admin/cases" },
          { name: "Users", href: "/dashboard/admin/users" },
          { name: "Analytics", href: "/dashboard/admin/analytics" },
          { name: "Settings", href: "/dashboard/admin/settings" },
        ];
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "CLIENT":
        return "bg-blue-100 text-blue-800";
      case "STAFF":
        return "bg-green-100 text-green-800";
      case "LEGAL":
        return "bg-purple-100 text-purple-800";
      case "ADMIN":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-2xl font-bold text-blue-900">
                  Demaek's Global
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={getRoleBadgeColor(role)}>
                {role}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.name?.charAt(0)?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-red-600"
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
