"use client";

import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { FolderOpen, Calendar, Gavel, FileText, Scale, ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";

export default function LegalDashboardPage() {
  const { data: session } = useSession();
  const { data: legalCases, isLoading: casesLoading } = api.case.getLegalCases.useQuery();

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "IN_LITIGATION":
        return "bg-purple-100 text-purple-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "LITIGATION":
        return "bg-red-100 text-red-800";
      case "ARBITRATION":
        return "bg-orange-100 text-orange-800";
      case "MEDIATION":
        return "bg-blue-100 text-blue-800";
      case "SETTLEMENT":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {session?.user?.name || "Legal Counsel"}!
        </h1>
        <p className="text-purple-100 mb-4">
          Manage legal proceedings and court schedules
        </p>
        <div className="flex gap-3">
          <Link href="/dashboard/legal/cases">
            <Button variant="secondary" className="bg-white text-purple-600 hover:bg-purple-50">
              <Gavel className="mr-2 h-4 w-4" />
              View Legal Cases
            </Button>
          </Link>
          <Link href="/dashboard/legal/calendar">
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
              <Calendar className="mr-2 h-4 w-4" />
              Court Calendar
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Legal Cases</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {casesLoading ? "..." : legalCases?.filter(c => c.status === "IN_LITIGATION").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently in litigation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Court Hearings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              This week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Legal Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">
              Pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Settlement Rate</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72%</div>
            <p className="text-xs text-muted-foreground">
              This quarter
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Cases */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Legal Proceedings</CardTitle>
              <CardDescription>
                Cases currently in litigation or legal review
              </CardDescription>
            </div>
            <Link href="/dashboard/legal/cases">
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
          ) : legalCases && legalCases.length > 0 ? (
            <div className="space-y-4">
              {legalCases
                .filter(c => c.status === "IN_LITIGATION" || c.type === "LITIGATION")
                .slice(0, 5)
                .map((case_) => (
                <div key={case_.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Gavel className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">{case_.caseNumber}</p>
                      <p className="text-sm text-gray-500">{case_.debtorName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getTypeColor(case_.type || "LITIGATION")}>
                      {case_.type || "LITIGATION"}
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
              <Gavel className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No active legal cases</h3>
              <p className="mt-1 text-sm text-gray-500">
                All cases are currently being handled by staff.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-purple-600" />
              Court Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              View upcoming court dates and hearings
            </p>
            <Link href="/dashboard/legal/calendar">
              <Button variant="outline" size="sm">
                View Calendar
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <BookOpen className="mr-2 h-5 w-5 text-purple-600" />
              Legal Research
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Access legal research tools and case law
            </p>
            <Link href="/dashboard/legal/research">
              <Button variant="outline" size="sm">
                Start Research
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <FileText className="mr-2 h-5 w-5 text-purple-600" />
              Document Library
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-3">
              Legal forms, templates, and documents
            </p>
            <Link href="/dashboard/legal/documents">
              <Button variant="outline" size="sm">
                Browse Library
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
