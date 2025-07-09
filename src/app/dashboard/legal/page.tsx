"use client";

import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Gavel, FileText, Calendar, BookOpen, Scale, ArrowRight, Plus, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function LegalDashboardPage() {
  const { data: session } = useSession();
  const { data: legalCases, isLoading: casesLoading } = api.case.getLegalCases.useQuery();
  const { data: documents, isLoading: documentsLoading } = api.document.getMyDocuments.useQuery();

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "LITIGATION":
        return "bg-purple-100 text-purple-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLegalStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PRE_LITIGATION":
        return "bg-blue-100 text-blue-800";
      case "LITIGATION":
        return "bg-red-100 text-red-800";
      case "JUDGMENT":
        return "bg-purple-100 text-purple-800";
      case "ENFORCEMENT":
        return "bg-orange-100 text-orange-800";
      case "SETTLED":
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
          Welcome, {session?.user?.name || "Legal Counsel"}!
        </h1>
        <p className="text-purple-100 mb-4">
          Manage legal proceedings, court schedules, and case documentation
        </p>
        <div className="flex gap-3">
          <Link href="/dashboard/legal/litigation/new">
            <Button variant="secondary" className="bg-white text-purple-600 hover:bg-purple-50">
              <Gavel className="mr-2 h-4 w-4" />
              New Legal Action
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
            <CardTitle className="text-sm font-medium">Legal Cases</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {casesLoading ? "..." : legalCases?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Under legal review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Litigation</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {casesLoading ? "..." : legalCases?.filter(c => c.status === "UNDER_REVIEW").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              In court proceedings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Legal Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documentsLoading ? "..." : documents?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Filed and drafted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Hearings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Next 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Legal Cases */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Legal Cases</CardTitle>
              <CardDescription>
                Cases requiring legal attention or in litigation
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
              {legalCases.slice(0, 5).map((case_) => (
                <div key={case_.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="bg-purple-100 p-2 rounded-full">
                      <Gavel className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">{case_.caseNumber}</p>
                      <p className="text-sm text-gray-500">{case_.debtorName}</p>
                      <p className="text-xs text-gray-400">
                        Filed: {case_.createdAt ? new Date(case_.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getLegalStatusBadgeColor('PRE_LITIGATION')}>
                      PRE_LITIGATION
                    </Badge>
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
              <Gavel className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No legal cases</h3>
              <p className="mt-1 text-sm text-gray-500">
                Legal cases will appear here when escalated.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Court Dates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Upcoming Court Dates</CardTitle>
              <CardDescription>
                Scheduled hearings and court appearances
              </CardDescription>
            </div>
            <Link href="/dashboard/legal/calendar">
              <Button variant="outline" size="sm">
                View Calendar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mock court dates - replace with real data */}
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className="bg-red-100 p-2 rounded-full">
                  <Calendar className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">Smith vs. ABC Corp</p>
                  <p className="text-sm text-gray-500">Judgment Hearing</p>
                  <p className="text-xs text-gray-400">Courtroom 3A</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className="bg-red-100 text-red-800">
                  Urgent
                </Badge>
                <span className="text-sm font-medium">Tomorrow 10:00 AM</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className="bg-orange-100 p-2 rounded-full">
                  <Calendar className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Johnson Debt Recovery</p>
                  <p className="text-sm text-gray-500">Settlement Conference</p>
                  <p className="text-xs text-gray-400">Courtroom 1B</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className="bg-orange-100 text-orange-800">
                  Medium
                </Badge>
                <span className="text-sm font-medium">March 15, 2:00 PM</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legal Research & Resources */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Legal Research & Resources</CardTitle>
              <CardDescription>
                Recent research and legal precedents
              </CardDescription>
            </div>
            <Link href="/dashboard/legal/research">
              <Button variant="outline" size="sm">
                Research Library
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3 mb-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Debt Collection Laws</span>
              </div>
              <p className="text-sm text-gray-600">Updated consumer protection regulations</p>
            </div>
            
            <div className="p-4 border rounded-lg hover:bg-gray-50">
              <div className="flex items-center space-x-3 mb-2">
                <Scale className="h-5 w-5 text-purple-600" />
                <span className="font-medium">Recent Precedents</span>
              </div>
              <p className="text-sm text-gray-600">Case law affecting debt recovery</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
