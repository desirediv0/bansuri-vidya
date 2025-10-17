"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/helper/AuthContext";
import { format } from "date-fns";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PasswordValidation from "@/components/ui/PasswordValidation";

import {
    BookOpenIcon,
    PencilIcon,
    ShieldCheckIcon,
    CalendarIcon,
    UserIcon,
    Mail,
} from "lucide-react";

import type { ApiResponseTh, Enrollment, UserSec, Purchase } from "@/type";
import UserCertificates from "../UserCertificates";
import Link from "next/link";

interface UserSubscription {
    type: "ONLINE" | "OFFLINE";
    startDate: string;
    endDate: string;
    fees: number;
    status: "ACTIVE" | "EXPIRED";
    lastPayment: string;
    progress?: number;
    achievements?: number;
    attendance?: number;
    batchTiming?: string;
    location?: string;
}

interface ExtendedUserSec extends UserSec {
    subscription?: UserSubscription;
    lastActive?: string;
    location?: string;
    totalCourses?: number;
    completedCourses?: number;
    certificatesEarned?: number;
    joinedDate?: string;
}

const LoadingState = () => (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-white via-red-50 to-gray-50 mt-20">
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-64 flex-shrink-0">
                    <Skeleton className="h-[500px] w-full rounded-lg" />
                </div>
                <div className="flex-1">
                    <Skeleton className="h-32 w-full rounded-lg mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <Skeleton className="h-40 w-full rounded-lg" />
                        <Skeleton className="h-40 w-full rounded-lg" />
                    </div>
                    <Skeleton className="h-80 w-full rounded-lg" />
                </div>
            </div>
        </div>
    </div>
);

const ErrorState = ({ error, retry }: { error: string; retry: () => void }) => (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-white via-red-50 to-gray-50">
        <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <Button onClick={retry} className="bg-red-600 hover:bg-red-700 text-white">
                    Try Again
                </Button>
            </CardContent>
        </Card>
    </div>
);

export default function DashboardPage() {
    const { checkAuth } = useAuth();
    const [user, setUser] = useState<ExtendedUserSec | null>(null);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const router = useRouter();

    // data fetch
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const isAuthenticated = await checkAuth();
                if (!isAuthenticated) {
                    router.push("/auth");
                    return;
                }

                const [userResponse, enrollmentsResponse, purchasesResponse] =
                    await Promise.all([
                        axios.get<ApiResponseTh<{ user: UserSec }>>(
                            `${process.env.NEXT_PUBLIC_API_URL}/user/get-user`
                        ),
                        axios.get<ApiResponseTh<Enrollment[]>>(
                            `${process.env.NEXT_PUBLIC_API_URL}/enrollment/user`
                        ),
                        axios.get<ApiResponseTh<Purchase[]>>(
                            `${process.env.NEXT_PUBLIC_API_URL}/purchase/my-course`
                        ),
                    ]);

                if (userResponse.data && userResponse.data.success) {
                    setUser(userResponse.data.data.user);
                }

                if (enrollmentsResponse.data && enrollmentsResponse.data.success) {
                    const processed = enrollmentsResponse.data.data.map((enrollment) => {
                        const expiryDate = enrollment.expiryDate;
                        const isExpired = expiryDate ? new Date(expiryDate) < new Date() : false;
                        const daysLeft = expiryDate
                            ? Math.max(
                                0,
                                Math.ceil(
                                    (new Date(expiryDate).getTime() - new Date().getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )
                            )
                            : null;
                        return { ...enrollment, isExpired, daysLeft } as any;
                    });
                    setEnrollments(processed);
                }

                if (purchasesResponse.data && purchasesResponse.data.success) {
                    const original = Array.isArray(purchasesResponse.data.message)
                        ? purchasesResponse.data.message
                        : [];
                    const processed = original.map((purchase) => {
                        const expiryDate = purchase.expiryDate;
                        const isExpired = expiryDate ? new Date(expiryDate) < new Date() : false;
                        const daysLeft = expiryDate
                            ? Math.max(
                                0,
                                Math.ceil(
                                    (new Date(expiryDate).getTime() - new Date().getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )
                            )
                            : null;
                        return { ...purchase, isExpired, daysLeft } as any;
                    });
                    setPurchases(processed);
                }
            } catch (error) {
                setError("An error occurred while fetching data");
                console.error("Fetch error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [checkAuth, router]);

    const handleSaveName = async (name: string) => {
        if (isUpdating || !user) return;
        if (!name.trim() || name === user?.name) return;

        try {
            setIsUpdating(true);
            const response = await axios.patch(
                `${process.env.NEXT_PUBLIC_API_URL}/user/update-name`,
                { name },
                { withCredentials: true }
            );
            if (response.data && response.data.success) {
                setUser((prev) => (prev ? { ...prev, name } : prev));
                toast.success("Name updated successfully");
            } else {
                throw new Error(response.data.message || "Failed to update name");
            }
        } catch (error: any) {
            console.error("Error updating name:", error);
            toast.error(error.response?.data?.message || "Failed to update name");
        } finally {
            setIsUpdating(false);
            setIsEditing(false);
        }
    };

    const PasswordChangeCard = () => {
        const [currentPassword, setCurrentPassword] = useState("");
        const [newPassword, setNewPassword] = useState("");
        const [confirmPassword, setConfirmPassword] = useState("");
        const [isChanging, setIsChanging] = useState(false);

        const resetFields = () => {
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        };

        const handleChangePassword = async (e: React.FormEvent) => {
            e.preventDefault();
            if (isChanging) return;
            if (!currentPassword || !newPassword || !confirmPassword) {
                toast.error("Please fill all fields");
                return;
            }
            if (newPassword !== confirmPassword) {
                toast.error("New password and confirm password do not match");
                return;
            }

            try {
                setIsChanging(true);
                const res = await axios.patch(
                    `${process.env.NEXT_PUBLIC_API_URL}/user/update-password`,
                    { currentPassword, newPassword },
                    { withCredentials: true }
                );
                if (res.data && res.data.success) {
                    toast.success(res.data.message || "Password updated successfully");
                    resetFields();
                } else {
                    throw new Error(res.data?.message || "Failed to update password");
                }
            } catch (err: any) {
                console.error("Password change error:", err);
                toast.error(err.response?.data?.message || err.message || "Failed to update password");
            } finally {
                setIsChanging(false);
            }
        };

        return (
            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                        <ShieldCheckIcon className="h-5 w-5 mr-2 text-red-600" />
                        Change Password
                    </h3>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="Current password"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-700 mb-1">New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="New password"
                            />
                            <div className="mt-2">
                                <PasswordValidation password={newPassword} />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                placeholder="Confirm new password"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white" disabled={isChanging}>
                                {isChanging ? "Updating..." : "Update Password"}
                            </Button>
                            <Button type="button" variant="ghost" onClick={resetFields} disabled={isChanging}>
                                Reset
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        );
    };

    if (isLoading) return <LoadingState />;
    if (error) return <ErrorState error={error} retry={() => location.reload()} />;
    if (!user) return null;

    const NameEditor = ({ initialName, onSave, onCancel }: { initialName: string; onSave: (name: string) => void; onCancel: () => void; }) => {
        const [name, setName] = useState(initialName);
        const inputRef = useRef<HTMLInputElement>(null);
        useEffect(() => {
            const t = setTimeout(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            }, 50);
            return () => clearTimeout(t);
        }, []);
        return (
            <div className="flex-1 isolate" onClick={(e) => e.stopPropagation()}>
                <form
                    onSubmit={(e) => { e.preventDefault(); name.trim() ? onSave(name.trim()) : onCancel(); }}
                    className="flex items-center gap-2 w-full max-w-md"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="w-full max-w-xs">
                        <input
                            ref={inputRef}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === "Escape" && onCancel()}
                            className="w-full border rounded px-3 py-2"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button type="submit" variant="outline" size="sm">Save</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
                    </div>
                </form>
            </div>
        );
    };

    const UserInfo = () => (
        <Card className="border-red-100 mb-6 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    <div className="relative">
                        <div className="h-28 w-28 md:h-24 md:w-24 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-3xl md:text-2xl font-bold">
                            {user?.name.charAt(0)}
                        </div>
                        {user?.isVerified && (
                            <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1">
                                <ShieldCheckIcon className="h-4 w-4 text-white" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                            {isEditing ? (
                                <NameEditor initialName={user?.name || ""} onSave={handleSaveName} onCancel={() => setIsEditing(false)} />
                            ) : (
                                <>
                                    <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                                        <PencilIcon className="h-4 w-4" />
                                    </Button>
                                </>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Mail className="h-4 w-4 text-red-500" />
                                <span>{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <UserIcon className="h-4 w-4 text-red-500" />
                                <Badge variant="outline" className="text-sm font-medium bg-red-50">
                                    {user?.role}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <CalendarIcon className="h-4 w-4 text-red-500" />
                                <span>
                                    Joined {format(new Date(user?.joinedDate || Date.now()), "MMMM yyyy")}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    const DashboardStats = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                        <BookOpenIcon className="h-5 w-5 mr-2 text-red-600" />
                        Course Summary
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <Link href={"/user-profile/my-courses"} className="text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                Enrolled Courses
                            </Link>
                            <Badge variant="outline" className="bg-red-50 text-red-700 font-medium">
                                {enrollments.length}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <Link href={"/user-profile/my-courses"} className="text-gray-600 bg-gray-50 px-2 py-1 rounded">Purchased Courses</Link>
                            <Badge variant="outline" className="bg-red-50 text-red-700 font-medium">
                                {purchases.length}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Resources</span>
                            <Badge variant="outline" className="bg-red-50 text-red-700 font-medium">
                                {enrollments.length + purchases.length}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 font-plus-jakarta-sans mt-20 md:mb-10">
            <div className="max-w-7xl mx-auto p-5 md:p-6">
                <div className="space-y-6">
                    <UserInfo />
                    <DashboardStats />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <UserCertificates />
                        <PasswordChangeCard />
                    </div>
                </div>
            </div>
        </div>
    );
}
