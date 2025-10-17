"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useAuth } from "@/helper/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import EnhancedCourseCard from "../../../_components/EnhancedCourseCard";
import type { ApiResponseTh, Enrollment } from "@/type";
import { BookOpenIcon } from "lucide-react";

export default function MyCoursesPage() {
    const { checkAuth } = useAuth();
    const router = useRouter();
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const ok = await checkAuth();
            if (!ok) {
                router.push("/auth");
                return;
            }
            try {
                const enrollmentsResponse = await axios.get<ApiResponseTh<Enrollment[]>>(
                    `${process.env.NEXT_PUBLIC_API_URL}/enrollment/user`
                );

                if (enrollmentsResponse.data && enrollmentsResponse.data.success) {
                    const processedEnrollments = enrollmentsResponse.data.data.map((enrollment) => {
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
                    setEnrollments(processedEnrollments);
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [checkAuth, router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 font-plus-jakarta-sans mt-24 mb-10">
            <div className="max-w-7xl mx-auto p-4 md:p-6">
                <section className="mb-10">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <BookOpenIcon className="h-5 w-5 text-red-600" />
                            My Enrolled Courses
                        </h2>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.refresh()}
                            className="flex items-center gap-2"
                        >
                            ⟳ Refresh
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? (
                            // Show skeleton placeholders while loading
                            Array.from({ length: 6 }).map((_, idx) => (
                                <Card key={idx} className="p-4">
                                    <div className="space-y-3">
                                        <Skeleton className="h-40 w-full rounded-lg" />
                                        <div className="flex justify-between items-center">
                                            <Skeleton className="h-4 w-1/3 rounded" />
                                            <Skeleton className="h-4 w-1/6 rounded" />
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : enrollments.length === 0 ? (
                            <Card className="col-span-full p-8 text-center border-dashed border-2 border-red-200">
                                <p className="text-gray-600 mb-4">You haven't enrolled in any courses yet.</p>
                                <Button className="bg-red-600 hover:bg-red-700" onClick={() => router.push("/courses")}>
                                    Browse Courses
                                </Button>
                            </Card>
                        ) : (
                            enrollments.map((enrollment: any) => (
                                <EnhancedCourseCard
                                    hidePrice={true}
                                    key={enrollment.course.id}
                                    course={enrollment.course}
                                    expiryDate={enrollment.expiryDate}
                                    isExpired={enrollment.isExpired}
                                    daysLeft={enrollment.daysLeft}
                                />
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
