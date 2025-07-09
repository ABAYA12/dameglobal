"use client";

import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { FolderOpen, Users, MessageSquare, Clock, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function StaffDashboardPage() {
  const { data: session } = useSession();
  const { data: assignedCases, isLoading: casesLoading } = api.case.getStaffCases.useQuery();

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

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {session?.user?.name || "Staff Member"}!
        </h1>
        <p className="text-green-100 mb-4">
          Manage your assigned cases and track progress
        </p>
        <div className="flex gap-3">
          <Link href="/dashboard/staff/cases">
            <Button variant="secondary" className="bg-white text-green-600 hover:bg-green-50">
              <FolderOpen className="mr-2 h-4 w-4" />
              View All Cases
            </Button>
          </Link>
          <Link href="/dashboard/staff/cases/new">
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
              Create New Case
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Cases</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {casesLoading ? "..." : assignedCases?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +3 new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {casesLoading ? "..." : assignedCases?.filter(c => c.priority === "HIGH").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requiring immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {casesLoading ? "..." : new Set(assignedCases?.map(c => c.clientId)).size || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all cases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cases */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Priority Cases</CardTitle>
              <CardDescription>
                Cases requiring your immediate attention
              </CardDescription>
            </div>
            <Link href="/dashboard/staff/cases">
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
          ) : assignedCases && assignedCases.length > 0 ? (
            <div className="space-y-4">
              {assignedCases
                .filter(c => c.priority === "HIGH" || c.status === "IN_PROGRESS")
                .slice(0, 5)
                .map((case_) => (
                <div key={case_.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 p-2 rounded-full">
                      <FolderOpen className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{case_.caseNumber}</p>
                      <p className="text-sm text-gray-500">{case_.debtorName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getPriorityBadgeColor(case_.priority)}>
                      {case_.priority}
                    </Badge>
                    <Badge className={getStatusBadgeColor(case_.status)}>
                      {case_.status}
                    </Badge>
                    <span className="text-sm font-medium">${case_.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No assigned cases</h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't have any cases assigned to you yet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
