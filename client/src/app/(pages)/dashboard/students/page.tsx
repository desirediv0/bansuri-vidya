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
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

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

  const fetchUsers = async () => {
    try {
      const response = await axios.get<{
        data: { users: User[]; totalUsers: number };
      }>(`${process.env.NEXT_PUBLIC_API_URL}/user/get-all-users`, {
        withCredentials: true,
      });
      setUsers(response.data.data.users);
      setTotalUsers(response.data.data.totalUsers);
    } catch (error) {
      handleAxiosError(error);
    } finally {
      setLoading(false);
    }
  };

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
          {loading ? (
            <UserTableSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
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
                      {/* Name Cell */}
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

                      {/* Email Cell - Read Only */}
                      <TableCell>{user.email}</TableCell>

                      {/* Role Cell */}
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
                            className={`px-2 py-1 rounded-full text-xs ${
                              user.role === "ADMIN"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {user.role}
                          </span>
                        )}
                      </TableCell>

                      {/* Verification Status Cell */}
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
                              <SelectItem value="false">
                                Not Verified
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              user.isVerified
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {user.isVerified ? "Yes" : "No"}
                          </span>
                        )}
                      </TableCell>

                      {/* Created At Cell */}
                      <TableCell>
                        <span className="text-xs text-gray-600">
                          {formatDate(user.createdAt)}
                        </span>
                      </TableCell>

                      {/* Updated At Cell */}
                      <TableCell>
                        <span className="text-xs text-gray-600">
                          {formatDate(user.updatedAt)}
                        </span>
                      </TableCell>

                      {/* Actions Cell */}
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
