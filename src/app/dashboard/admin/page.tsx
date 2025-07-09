"use client";

export const dynamic = 'force-dynamic';

import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { 
  Users, 
  FolderOpen, 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Database, 
  Activity,
  ArrowRight, 
  Plus, 
  AlertTriangle,
  UserCheck,
  Crown
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const { data: users, isLoading: usersLoading } = api.user.getAllUsers.useQuery();
  const { data: cases, isLoading: casesLoading } = api.case.getAllCases.useQuery();
  const { data: analytics, isLoading: analyticsLoading } = api.case.getAnalytics.useQuery();

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-gray-100 text-gray-800";
      case "SUSPENDED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-2">
          <Crown className="h-8 w-8" />
          <h1 className="text-3xl font-bold">
            System Administrator
          </h1>
        </div>
        <p className="text-red-100 mb-4">
          Complete system oversight and management dashboard
        </p>
        <div className="flex gap-3">
          <Link href="/dashboard/admin/users/new">
            <Button variant="secondary" className="bg-white text-red-600 hover:bg-red-50">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </Link>
          <Link href="/dashboard/admin/settings">
            <Button variant="outline" className="border-white text-white hover:bg-white hover:text-red-600">
              <Shield className="mr-2 h-4 w-4" />
              System Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersLoading ? "..." : users?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {casesLoading ? "..." : cases?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recovery</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analyticsLoading ? "..." : "2.4M"}
            </div>
            <p className="text-xs text-muted-foreground">
              +23% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">99.8%</div>
            <p className="text-xs text-muted-foreground">
              Uptime this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              User Management
            </CardTitle>
            <CardDescription>
              Manage user accounts, roles, and permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/users">
              <Button className="w-full">
                Manage Users
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-green-600" />
              Case Management
            </CardTitle>
            <CardDescription>
              Overview and management of all cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/cases">
              <Button className="w-full">
                Manage Cases
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Analytics
            </CardTitle>
            <CardDescription>
              Detailed reports and business intelligence
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/admin/analytics">
              <Button className="w-full">
                View Analytics
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>
                Latest user registrations and activities
              </CardDescription>
            </div>
            <Link href="/dashboard/admin/users">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : users && users.length > 0 ? (
            <div className="space-y-4">
              {users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <UserCheck className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">
                        Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                      ACTIVE
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by adding users to the system.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                System Alerts
              </CardTitle>
              <CardDescription>
                Important notifications and system status
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All Alerts
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">System Backup Completed</p>
                <p className="text-xs text-green-600">Daily backup completed successfully at 2:00 AM</p>
              </div>
              <span className="text-xs text-green-600">2 hours ago</span>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">System Update Available</p>
                <p className="text-xs text-blue-600">New security patches available for installation</p>
              </div>
              <span className="text-xs text-blue-600">1 day ago</span>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">High User Activity</p>
                <p className="text-xs text-yellow-600">Increased user activity detected - monitor performance</p>
              </div>
              <span className="text-xs text-yellow-600">3 hours ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
