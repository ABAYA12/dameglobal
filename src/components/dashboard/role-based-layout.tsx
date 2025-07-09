"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import ClientDashboardLayout from "./layout.client";
import StaffDashboardLayout from "./layout.staff";
import LegalDashboardLayout from "./layout.legal";
import AdminDashboardLayout from "./layout.admin";

interface RoleBasedLayoutProps {
  children: ReactNode;
}

export default function RoleBasedLayout({ children }: RoleBasedLayoutProps) {
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

  const userRole = session.user?.role;

  switch (userRole) {
    case "CLIENT":
      return <ClientDashboardLayout>{children}</ClientDashboardLayout>;
    case "STAFF":
      return <StaffDashboardLayout>{children}</StaffDashboardLayout>;
    case "LEGAL":
      return <LegalDashboardLayout>{children}</LegalDashboardLayout>;
    case "ADMIN":
      return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
    default:
      // Default to client layout for unknown roles
      return <ClientDashboardLayout>{children}</ClientDashboardLayout>;
  }
}
