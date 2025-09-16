"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/helper/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface NewUser {
  name: string;
  email: string;
  password: string;
  role: "STUDENT" | "ADMIN";
  usertype: "ONLINE" | "OFFLINE";
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  usertype: "ONLINE" | "OFFLINE";
  isVerified: boolean;
  slug: string;
  provider?: string;
  verificationToken?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserChanges {
  [userId: string]: {
    [field: string]: any;
  };
}

const AdminUsersPage: React.FC = () => {
  const { checkAuth } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(50);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("createdAt_desc");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [lastAppliedFilters, setLastAppliedFilters] = useState({ searchQuery: "", sortOrder: "createdAt_desc", fromDate: "", toDate: "" });
  const [newUser, setNewUser] = useState<NewUser>({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
    usertype: "ONLINE",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [userChanges, setUserChanges] = useState<UserChanges>({});
  const [selectedUserSlug, setSelectedUserSlug] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserPurchases, setSelectedUserPurchases] = useState<any[]>([]);
  const [selectedUserEnrollments, setSelectedUserEnrollments] = useState<any[]>([]);
  const [isPurchasesLoading, setIsPurchasesLoading] = useState(false);
  const [courseProgressMap, setCourseProgressMap] = useState<Record<string, { loading: boolean; data?: { completed: number; total: number; percentage: number } }>>({});
  const [lastFetch, setLastFetch] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      const isAuth = await checkAuth();
      if (!isAuth) {
        setLoading(false);
        toast({
          title: "Authentication Error",
          description: "You are not authorized to view this page.",
          variant: "destructive",
        });
        return;
      }
      fetchUsers();
    };
    init();
  }, [checkAuth]);



  const fetchUsers = async (opts?: { page?: number }) => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: opts?.page || page,
        limit,
        sort: sortOrder,
      };

      if (searchQuery) params.search = searchQuery;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user/get-all-users`, {
        withCredentials: true,
        params,
      });

      const data = response.data.data;
      setUsers(data.users || []);
      setTotalUsers(data.totalUsers || 0);
      setPage(data.page || opts?.page || page);
      setLastFetch(Date.now());
    } catch (error) {
      handleAxiosError(error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh when page becomes visible or when connection is restored
  useEffect(() => {
    const shouldRefetch = () => {
      if (!lastFetch) return true;
      // If last fetch was more than 30 seconds ago, refetch
      return Date.now() - lastFetch > 30000;
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible" && shouldRefetch()) {
        fetchUsers({ page: 1 });
      }
    };

    const onOnline = () => {
      if (shouldRefetch()) fetchUsers({ page: 1 });
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, [lastFetch, page]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewUser({
      ...newUser,
      [name]: value as "STUDENT" | "ADMIN" | "ONLINE" | "OFFLINE",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/user/register`,
        newUser,
        {
          withCredentials: true,
        }
      );
      toast({
        title: "Success",
        description: response.data.message,
      });
      fetchUsers();
      setNewUser({
        name: "",
        email: "",
        password: "",
        role: "STUDENT",
        usertype: "ONLINE",
      });
    } catch (error) {
      handleAxiosError(error);
    }
  };

  const handleDelete = async (slug: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await axios.delete(
          `${process.env.NEXT_PUBLIC_API_URL}/user/admin-delete-user/${slug}`,
          {
            withCredentials: true,
          }
        );
        toast({
          title: "Success",
          description: response.data.message,
        });
        fetchUsers();
      } catch (error) {
        handleAxiosError(error);
      }
    }
  };

  const handleUserChange = (userId: string, field: string, value: any) => {
    // Update changes tracker
    setUserChanges((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [field]: value,
      },
    }));

    // Update UI state
    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, [field]: value } : user
      )
    );
  };

  const handleUpdate = async (slug: string, userId: string) => {
    const changes = userChanges[userId];

    if (!changes || Object.keys(changes).length === 0) {
      setEditingUser(null);
      return;
    }

    try {
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/user/admin-update-user/${slug}`,
        changes,
        { withCredentials: true }
      );

      toast({
        title: "Success",
        description: response.data.message,
      });

      // Clear changes for this user
      setUserChanges((prev) => {
        const { [userId]: _, ...rest } = prev;
        return rest;
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      handleAxiosError(error);
    }
  };

  const handleAxiosError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // Format date function
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Format currency helper
  const formatCurrency = (value: number | string | null | undefined) => {
    if (value == null || value === "") return "-";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (Number.isNaN(num)) return "-";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(num as number);
  };

  // Fetch purchases for a specific user (used by the Eye button and mobile card)
  const fetchUserPurchases = async (slug: string) => {
    if (!slug) return;
    setSelectedUserSlug(slug);
    // Try to resolve userId from the current users list so we can fetch per-course progress
    const matched = users.find((u) => u.slug === slug);
    if (matched) setSelectedUserId(matched.id);
    setIsModalOpen(true);
    setIsPurchasesLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/purchase/user/${slug}`, {
        withCredentials: true,
      });
      const data = res.data?.data?.purchases || [];
      setSelectedUserPurchases(data);
      // If response contains userId, set it for progress calls; otherwise try to derive later
      if (res.data?.data?.userId) setSelectedUserId(res.data.data.userId);
      // fetch enrollments for this user (admin endpoint)
      try {
        const enr = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/enrollment/user/${slug}`, { withCredentials: true });
        const enrollments = enr.data?.data?.enrollments || [];
        setSelectedUserEnrollments(enrollments);
      } catch (e) {
        // If admin enrollment endpoint not available, clear enrollments
        setSelectedUserEnrollments([]);
      }
    } catch (error) {
      handleAxiosError(error);
      setSelectedUserPurchases([]);
    } finally {
      setIsPurchasesLoading(false);
    }
  };

  // Fetch per-course progress for selected user and courseId. Caches result in courseProgressMap keyed by `${userId}_${courseId}`
  const fetchCourseProgress = async (userId: string, courseId: string) => {
    const key = `${userId}_${courseId}`;
    // If already loading or present, skip
    if (courseProgressMap[key]?.loading || courseProgressMap[key]?.data) return;

    setCourseProgressMap((prev) => ({ ...prev, [key]: { loading: true } }));
    try {
      const resp = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user-progress/user/${userId}/course/${courseId}`, { withCredentials: true });
      const data = resp.data?.data || null;
      setCourseProgressMap((prev) => ({ ...prev, [key]: { loading: false, data } }));
    } catch (err) {
      setCourseProgressMap((prev) => ({ ...prev, [key]: { loading: false } }));
      // don't surface error here beyond console
      console.error("Failed to fetch course progress", err);
    }
  };

  const UserTableSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Verified</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Updated At</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-[150px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-[180px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-[80px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-[50px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-[120px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-[120px]" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-8 w-[100px]" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-center">User Management</h1>
        <Link href="/dashboard/students/import-users">
          <Button variant="outline" size="sm">
            Import Users
          </Button>
        </Link>
      </div>

      {/* User Statistics Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-blue-700">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-800">{totalUsers}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-green-700">
              Verified Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-800">
              {users.filter((user) => user.isVerified).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-purple-700">
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-800">
              {users.filter((user) => user.role === "ADMIN").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>Manage existing users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
              <Input
                placeholder="Search by name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select
                value={sortOrder}
                onValueChange={(val) => setSortOrder(val)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt_desc">Newest</SelectItem>
                  <SelectItem value="createdAt_asc">Oldest</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full sm:w-44"
              />
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full sm:w-44"
              />
              {/* Determine if filters are dirty compared to last applied */}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setLastAppliedFilters({ searchQuery, sortOrder, fromDate, toDate });
                    fetchUsers({ page: 1 });
                  }}
                  className={`whitespace-nowrap ${searchQuery !== lastAppliedFilters.searchQuery || sortOrder !== lastAppliedFilters.sortOrder || fromDate !== lastAppliedFilters.fromDate || toDate !== lastAppliedFilters.toDate ? "bg-[#ba1c33] text-white" : "bg-gray-200 text-gray-700"}`}
                >
                  {searchQuery !== lastAppliedFilters.searchQuery || sortOrder !== lastAppliedFilters.sortOrder || fromDate !== lastAppliedFilters.fromDate || toDate !== lastAppliedFilters.toDate ? "Apply*" : "Apply"}
                </Button>
                <Button variant="outline" onClick={() => { setSearchQuery(""); setFromDate(""); setToDate(""); setSortOrder("createdAt_desc"); setLastAppliedFilters({ searchQuery: "", sortOrder: "createdAt_desc", fromDate: "", toDate: "" }); fetchUsers({ page: 1 }); }}>Reset</Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm">Total: <strong>{totalUsers}</strong></div>
              <div className="text-sm">Page: <strong>{page}</strong></div>
            </div>
          </div>

          {loading ? (
            <UserTableSkeleton />
          ) : (
            <div>
              {/* Mobile list (cards) */}
              <div className="md:hidden space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="p-3 border rounded bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-base">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                        <div className="text-sm text-gray-500 mt-1">{(user as any).provider || "credentials"} • {user.role}</div>
                        <div className="text-xs text-gray-400">Created: {formatDate(user.createdAt)}</div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <div className="text-sm">{user.isVerified ? <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Verified</span> : <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Not Verified</span>}</div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingUser(user.id)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(user.slug)}><Trash2 className="h-4 w-4" /></Button>
                          <Button size="sm" variant="outline" onClick={() => fetchUserPurchases(user.slug)}><Eye className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table for medium and larger screens */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          {editingUser === user.id ? (
                            <Input
                              value={user.name}
                              onChange={(e) =>
                                handleUserChange(user.id, "name", e.target.value)
                              }
                            />
                          ) : (
                            user.name
                          )}
                        </TableCell>

                        <TableCell>{user.email}</TableCell>

                        <TableCell>{(user as any).provider || "credentials"}</TableCell>

                        <TableCell>
                          {editingUser === user.id ? (
                            <Select
                              value={user.role}
                              onValueChange={(value) =>
                                handleUserChange(user.id, "role", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="STUDENT">Student</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${user.role === "ADMIN"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                                }`}
                            >
                              {user.role}
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          {editingUser === user.id ? (
                            <Select
                              value={user.isVerified.toString()}
                              onValueChange={(value) =>
                                handleUserChange(
                                  user.id,
                                  "isVerified",
                                  value === "true"
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Verified</SelectItem>
                                <SelectItem value="false">Not Verified</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${user.isVerified
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                                }`}
                            >
                              {user.isVerified ? "Yes" : "No"}
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <span className="text-xs text-gray-600">{formatDate(user.createdAt)}</span>
                        </TableCell>

                        <TableCell>
                          <span className="text-xs text-gray-600">{formatDate(user.updatedAt)}</span>
                        </TableCell>

                        <TableCell>
                          <div className="flex space-x-2">
                            {editingUser === user.id ? (
                              <Button
                                onClick={() => handleUpdate(user.slug, user.id)}
                                size="sm"
                                variant="outline"
                                disabled={!userChanges[user.id]}
                              >
                                Save
                              </Button>
                            ) : (
                              <Button
                                onClick={() => setEditingUser(user.id)}
                                size="sm"
                                variant="outline"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              onClick={() => handleDelete(user.slug)}
                              size="sm"
                              variant="destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => fetchUserPurchases(user.slug)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* Pagination controls */}
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <Button
                      disabled={page <= 1}
                      onClick={() => fetchUsers({ page: Math.max(1, page - 1) })}
                    >
                      Previous
                    </Button>
                  </div>
                  <div>
                    <span className="mx-2">Page {page} of {Math.ceil(totalUsers / limit) || 1}</span>
                  </div>
                  <div>
                    <Button
                      disabled={page >= Math.ceil(totalUsers / limit)}
                      onClick={() => fetchUsers({ page: page + 1 })}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchases Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Purchases</DialogTitle>
            <DialogDescription>Purchases for user: {selectedUserSlug}</DialogDescription>
          </DialogHeader>

          <div>
            {isPurchasesLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <div>
                {/* Enrollments (show first, mark free enrollments) */}
                <div className="mb-3">
                  <h3 className="font-medium mb-2">Enrollments</h3>
                  {selectedUserEnrollments.length === 0 ? (
                    <p className="text-sm text-gray-600">No enrollments found for this user.</p>
                  ) : (
                    <ul className="space-y-2">
                      {selectedUserEnrollments.map((e) => (
                        <li key={e.id} className="p-3 border rounded bg-white flex justify-between items-start">
                          <div>
                            <div className="font-medium">{e.courseTitle || e.course?.title || "Untitled Course"}</div>
                            <div className="text-sm text-gray-600">Enrolled: {e.createdAt ? formatDate(e.createdAt) : "-"}</div>
                            {e.expiryDate && <div className="text-xs text-gray-500">Expiry: {formatDate(e.expiryDate)}</div>}
                          </div>
                          <div className="text-right">
                            {/* Find matching purchase if exists */}
                            {selectedUserPurchases.find((p) => p.courseId === e.courseId) ? (
                              <Badge className="bg-green-50 text-green-700">Purchased</Badge>
                            ) : (
                              <Badge className="bg-blue-50 text-blue-700">Free Enrollment</Badge>
                            )}
                            {/* Progress action for enrollment */}
                            {selectedUserId && e.courseId && (
                              <div className="mt-2 flex items-center justify-end">
                                <Button size="sm" variant="ghost" onClick={() => fetchCourseProgress(selectedUserId, e.courseId)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            {/* Show progress if available */}
                            {selectedUserId && e.courseId && (() => {
                              const key = `${selectedUserId}_${e.courseId}`;
                              const entry = courseProgressMap[key];
                              if (!entry) return null;
                              if (entry.loading) return <div className="text-xs text-gray-500 mt-1">Loading progress...</div>;
                              if (entry.data) return (<div className="text-xs text-gray-500 mt-1">Progress: {entry.data.percentage}% ({entry.data.completed}/{entry.data.total})</div>);
                              return null;
                            })()}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Purchases list */}
                <div>
                  <h3 className="font-medium mb-2">Purchases</h3>
                  {selectedUserPurchases.length === 0 ? (
                    <p className="text-sm text-gray-600">No purchases found for this user.</p>
                  ) : (
                    <ul className="space-y-2">
                      {selectedUserPurchases.map((p) => {
                        const price = p.purchasePrice ?? p.price ?? null; // MRP/base price
                        const discountField = p.discountPrice ?? p.discount ?? null; // either discountedPrice or discountAmount depending on API

                        // Prefer server-normalized fields when available
                        const originalPrice = p.originalPrice ?? p.course?.price ?? p.purchasePrice ?? p.price ?? null;
                        const discountAmount = p.discountAmount ?? (p.discountPrice ?? p.discount ?? (originalPrice != null && p.purchasePrice != null ? Math.max(0, Number(originalPrice) - Number(p.purchasePrice)) : 0));
                        const finalPaid = p.finalPaid ?? (p.purchasePrice != null ? Number(p.purchasePrice) : (originalPrice != null ? Number(originalPrice) - Number(discountAmount || 0) : null));
                        const inconsistent = finalPaid == null;
                        return (
                          <li key={p.id} className="p-3 border rounded bg-white">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{p.courseTitle || p.course?.title || "Untitled Course"}</div>
                                <div className="text-sm text-gray-600">Purchased: {p.purchaseDate ? formatDate(p.purchaseDate) : "-"}</div>
                                {p.expiryDate && (
                                  <div className="text-xs text-gray-500">Expiry: {formatDate(p.expiryDate)}</div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-sm">Price: <strong>{formatCurrency(originalPrice)}</strong></div>
                                <div className="text-sm">Discount: <strong>{formatCurrency(discountAmount)}</strong></div>
                                <div className="text-sm">Total Paid: <strong>{formatCurrency(finalPaid)}</strong></div>
                                {inconsistent && <div className="text-xs text-red-600 mt-1">Pricing data incomplete</div>}


                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
          <CardDescription>Enter the details of the new user</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={newUser.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={newUser.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={handleInputChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <Select
                  name="role"
                  value={newUser.role}
                  onValueChange={(value) => handleSelectChange("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="usertype">User Type</Label>
                <Select
                  name="usertype"
                  value={newUser.usertype}
                  onValueChange={(value) =>
                    handleSelectChange("usertype", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONLINE">Online</SelectItem>
                    <SelectItem value="OFFLINE">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!newUser.name || !newUser.email || !newUser.password}
          >
            Create User
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminUsersPage;
