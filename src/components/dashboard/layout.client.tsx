import React from "react";
import Link from "next/link";

export default function ClientDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-white py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Client Portal</h1>
        <nav className="flex gap-4">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/dashboard/cases">My Cases</Link>
          <Link href="/dashboard/file-case">File a Case</Link>
          <Link href="/dashboard/documents">Documents</Link>
          <Link href="/dashboard/messages">Messages</Link>
          <Link href="/dashboard/payments">Payments</Link>
          <Link href="/dashboard/profile">Profile</Link>
        </nav>
      </header>
      <main className="flex-1 bg-background p-6">{children}</main>
      <footer className="bg-muted text-center py-2 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Demaek's Global Limited
      </footer>
    </div>
  );
}
