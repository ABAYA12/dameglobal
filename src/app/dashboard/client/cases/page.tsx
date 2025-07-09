"use client";

export const dynamic = 'force-dynamic';

import { api } from "~/utils/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { FolderOpen, Search, Plus, Filter, Eye } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ClientCasesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  
  const { data: cases, isLoading, refetch } = api.case.getClientCases.useQuery();

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "RECEIVED":
        return "bg-blue-100 text-blue-800";
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-purple-100 text-purple-800";
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
      case "URGENT":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredCases = cases?.filter((case_) => {
    const matchesSearch = 
      case_.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.debtorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || case_.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Cases</h1>
          <p className="text-gray-600">Track and manage your debt recovery cases</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/client/cases/new">
            <Plus className="mr-2 h-4 w-4" />
            File New Case
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">All Status</option>
                <option value="RECEIVED">Received</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                More Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cases List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCases && filteredCases.length > 0 ? (
          filteredCases.map((case_) => (
            <Card key={case_.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <FolderOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{case_.caseNumber}</h3>
                        <p className="text-gray-600">{case_.title}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-500">Debtor:</span>
                        <p className="text-gray-900">{case_.debtorName}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Amount Due:</span>
                        <p className="text-gray-900 font-semibold">${case_.totalAmountDue.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Original Due Date:</span>
                        <p className="text-gray-900">{new Date(case_.originalDueDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-500">Filed:</span>
                        <p className="text-gray-900">{new Date(case_.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {case_.description && (
                      <div>
                        <span className="font-medium text-gray-500">Description:</span>
                        <p className="text-gray-700 text-sm mt-1">{case_.description}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-3 ml-4">
                    <div className="flex flex-col gap-2">
                      <Badge className={getStatusBadgeColor(case_.status)}>
                        {case_.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={getPriorityBadgeColor(case_.priority)}>
                        {case_.priority}
                      </Badge>
                    </div>
                    
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/client/cases/${case_.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No cases found</h3>
                <p className="mt-2 text-gray-500">
                  {searchTerm || statusFilter 
                    ? "Try adjusting your search criteria"
                    : "Get started by filing your first debt recovery case"
                  }
                </p>
                {!searchTerm && !statusFilter && (
                  <div className="mt-6">
                    <Button asChild>
                      <Link href="/dashboard/client/cases/new">
                        <Plus className="mr-2 h-4 w-4" />
                        File New Case
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      {filteredCases && filteredCases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Overview of your cases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{filteredCases.length}</div>
                <div className="text-sm text-gray-500">Total Cases</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {filteredCases.filter(c => c.status === "UNDER_REVIEW").length}
                </div>
                <div className="text-sm text-gray-500">Under Review</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {filteredCases.filter(c => c.status === "RESOLVED").length}
                </div>
                <div className="text-sm text-gray-500">Resolved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  ${filteredCases.reduce((sum, c) => sum + c.totalAmountDue, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total Amount</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
