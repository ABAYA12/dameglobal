"use client";

export const dynamic = 'force-dynamic';

import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { FolderOpen, FileText, MessageSquare, CreditCard, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ClientDashboardPage() {
  const { data: session, status } = useSession();
  const { data: cases, isLoading: casesLoading } = api.case.getClientCases.useQuery(undefined, {
    enabled: !!session,
  });
  const { data: documents, isLoading: documentsLoading } = api.document.getClientDocuments.useQuery(undefined, {
    enabled: !!session,
  });
  const { data: messages, isLoading: messagesLoading } = api.message.getClientMessages.useQuery(undefined, {
    enabled: !!session,
  });

  // Show loading while session is being fetched
  if (status === "loading") {
    return <div className="p-6">Loading...</div>;
  }

  // Redirect if not authenticated
  if (!session) {
    return <div className="p-6">Please sign in to access the dashboard.</div>;
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {session?.user?.name || "Client"}!
        </h1>
        <p className="text-blue-100 mb-4">
          Track your debt recovery cases and manage your account
        </p>
        <Link href="/dashboard/client/cases/new">
          <Button variant="secondary" className="bg-white text-blue-600 hover:bg-blue-50">
            <Plus className="mr-2 h-4 w-4" />
            File New Case
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {casesLoading ? "..." : cases?.filter(c => c.status !== "CLOSED").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documentsLoading ? "..." : documents?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Including 3 new uploads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {messagesLoading ? "..." : messages?.filter(m => !m.isRead).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              From legal team
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recovery</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">
              Across all cases
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Cases</CardTitle>
              <CardDescription>
                Your most recent debt recovery cases
              </CardDescription>
            </div>
            <Link href="/dashboard/client/cases">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {casesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : cases && cases.length > 0 ? (
            <div className="space-y-4">
              {cases.slice(0, 3).map((case_) => (
                <div key={case_.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <FolderOpen className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{case_.caseNumber}</p>
                      <p className="text-sm text-gray-500">{case_.debtorName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusBadgeColor(case_.status)}>
                      {case_.status}
                    </Badge>
                    <span className="text-sm font-medium">${case_.totalAmountDue}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No cases yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by filing your first debt recovery case.
              </p>
              <div className="mt-6">
                <Link href="/dashboard/client/cases/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    File New Case
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
