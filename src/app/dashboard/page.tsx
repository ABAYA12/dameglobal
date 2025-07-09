"use client";

export const dynamic = 'force-dynamic';

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      redirect("/auth/signin");
      return;
    }

    // Redirect to role-specific dashboard
    const role = session.user?.role;
    switch (role) {
      case "CLIENT":
        redirect("/dashboard/client");
        break;
      case "STAFF":
        redirect("/dashboard/staff");
        break;
      case "LEGAL":
        redirect("/dashboard/legal");
        break;
      case "ADMIN":
        redirect("/dashboard/admin");
        break;
      default:
        redirect("/dashboard/client");
    }
  }, [session, status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return null;
}
