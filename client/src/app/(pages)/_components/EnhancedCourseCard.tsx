"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Award,
  TrendingUp,
  Flame,
  Star,
  BookOpen,
  Gift,
  Folder,
  Check,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { formatPrice } from "@/helper/FormatPrice";
import { CourseCardProps } from "@/type";
import parse from "html-react-parser";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const BadgeStyles = {
  bestseller: "bg-amber-400/20 text-amber-200 border-amber-400/40",
  trending: "bg-sky-400/20 text-sky-200 border-sky-400/40",
  popular: "bg-emerald-400/20 text-emerald-200 border-emerald-400/40",
  featured: "bg-violet-400/20 text-violet-200 border-violet-400/40",
};

export default function EnhancedCourseCard({
  course,
  hidePrice = false,
  expiryDate = null,
  isExpired = false,
  daysLeft = null,
}: CourseCardProps & {
  hidePrice?: boolean;
  expiryDate?: string | null;
  isExpired?: boolean;
  daysLeft?: number | null;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const isFree = !course.paid;
  const router = useRouter();
  const [courseProgress, setCourseProgress] = useState<{
    percentage: number;
    completedChapters: number;
    totalChapters: number;
  }>({
    percentage: 0,
    completedChapters: 0,
    totalChapters: 0,
  });

  const getImageUrl = (image: string | null | undefined) => {
    if (!image) return "https://placehold.co/600x400?text=No+Image";
    if (image.startsWith("http")) return image;
    return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
  };

  useEffect(() => {
    if (hidePrice) {
      const fetchCourseProgress = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/user-progress/course/${course.id}`,
            {
              credentials: "include",
            }
          );
          const data = await response.json();
          if (data.success) {
            setCourseProgress({
              percentage: data.data.percentage || 0,
              completedChapters: data.data.completedCount || 0,
              totalChapters: data.data.totalChapters || 0,
            });
          }
        } catch (error) {
          console.error("Failed to fetch course progress:", error);
        }
      };

      fetchCourseProgress();
    }
  }, [course.id, hidePrice]);

  const courseUrl = hidePrice
    ? `/courses/${course.slug}/${course.id}`
    : `/courses/${course.slug}`;

  // Display formatted expiry date
  const formatExpiryDate = (dateString: string | null) => {
    try {
      if (!dateString) return "N/A";
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const showValidityInfo = () => {
    const courseHasValidity = course.validityDays && course.validityDays > 0;

    if (isExpired) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="h-3 w-3 mr-1" /> Expired Access
        </Badge>
      );
    }

    if (daysLeft !== null && daysLeft !== undefined) {
      return (
        <Badge
          variant={daysLeft < 5 ? "destructive" : "outline"}
          className="text-xs"
        >
          <Clock className="h-3 w-3 mr-1" />
          {daysLeft} days left
        </Badge>
      );
    }

    if (courseHasValidity) {
      return (
        <Badge variant="outline" className="text-xs">
          <Clock className="h-3 w-3 mr-1" />
          {course.validityDays} days access
        </Badge>
      );
    }

    if (expiryDate === null && course.validityDays === 0) {
      return (
        <Badge variant="secondary" className="text-xs">
          <Check className="h-3 w-3 mr-1" />
          Lifetime Access
        </Badge>
      );
    }

    return null;
  };

  // Handle renew button click
  const handleRenew = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (course.slug) {
      router.push(`/courses/${course.slug}`);
    }
  };

  return (
    <div className={`block group ${isExpired ? "opacity-80" : ""}`}>
      <div
        className={`relative w-full max-w-md mx-auto overflow-hidden bg-white rounded-lg shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 h-full ${
          isExpired ? "border-2 border-red-200 bg-gray-50" : ""
        }`}
      >
        {/* Thumbnail with Overlay */}
        <div className="relative h-48 overflow-hidden">
          {isExpired && (
            <div className="absolute top-0 right-0 z-10">
              <div className="bg-red-600 text-white px-4 py-1 text-sm font-bold shadow-lg transform rotate-0">
                EXPIRED
              </div>
            </div>
          )}
          <Image
            src={getImageUrl(course.thumbnail)}
            alt={course.title}
            fill
            className={`object-cover transition-transform duration-700 ${isExpired ? "" : "group-hover:scale-110"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges Container */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2 max-w-[calc(100%-24px)]">
            {course.isBestseller && (
              <Badge className={`${BadgeStyles.bestseller} backdrop-blur-sm`}>
                <Award className="w-3.5 h-3.5 mr-1" /> Bestseller
              </Badge>
            )}
            {course.isTrending && (
              <Badge className={`${BadgeStyles.trending} backdrop-blur-sm`}>
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> Trending
              </Badge>
            )}
            {course.isPopular && (
              <Badge className={`${BadgeStyles.popular} backdrop-blur-sm`}>
                <Flame className="w-3.5 h-3.5 mr-1" /> Popular
              </Badge>
            )}
            {course.isFeatured && (
              <Badge className={`${BadgeStyles.featured} backdrop-blur-sm`}>
                <Star className="w-3.5 h-3.5 mr-1" /> Featured
              </Badge>
            )}
          </div>

          {/* Expiration Badge */}
          {hidePrice && expiryDate && (
            <div className="absolute bottom-3 right-3">
              {isExpired ? (
                <Badge variant="destructive" className="backdrop-blur-sm">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Expired
                </Badge>
              ) : (
                daysLeft !== null &&
                daysLeft !== undefined && (
                  <Badge
                    variant={daysLeft < 7 ? "destructive" : "outline"}
                    className={`backdrop-blur-sm ${
                      daysLeft < 7
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 mr-1" /> {daysLeft} days left
                  </Badge>
                )
              )}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-4">
          {/* Title */}
          <h3
            className={`text-lg font-bold text-gray-900 line-clamp-2 ${
              isExpired ? "text-gray-600" : "group-hover:text-red-600"
            } transition-colors`}
          >
            {course.title}
          </h3>

          {/* Description */}
          <div
            className={`text-sm ${isExpired ? "text-gray-500" : "text-gray-600"} line-clamp-2`}
          >
            {parse(course.description ?? "")}
          </div>

          {/* Meta Tags */}
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={`${isExpired ? "bg-gray-100" : "bg-gray-50/50"}`}
            >
              <BookOpen className="w-3.5 h-3.5 mr-1 text-gray-500" />
              {course.language}
            </Badge>
            <Badge
              variant="outline"
              className={`${isExpired ? "bg-gray-100" : "bg-gray-50/50"}`}
            >
              <Folder className="w-3.5 h-3.5 mr-1 text-gray-500" />
              {course?.category?.name}
            </Badge>
          </div>

          {/* Price or Progress Section */}
          <div className="pt-2">
            {hidePrice ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="secondary"
                    className={`${
                      isExpired
                        ? "bg-red-100 text-red-800"
                        : "bg-gradient-to-r from-blue-600 to-blue-800 text-white"
                    } border-0`}
                  >
                    {isExpired ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Access
                        Expired
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1" /> Enrolled
                      </>
                    )}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {courseProgress.completedChapters}/
                    {courseProgress.totalChapters} Chapters
                  </span>
                </div>
                <Progress
                  value={courseProgress.percentage}
                  className="h-1.5 bg-gray-100"
                />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">
                    {Math.round(courseProgress.percentage)}% Complete
                  </span>
                  {expiryDate && (
                    <span
                      className={`${
                        isExpired
                          ? "text-red-600 font-semibold"
                          : "text-gray-500"
                      }`}
                    >
                      {isExpired ? "Expired on: " : "Valid until: "}
                      {formatExpiryDate(expiryDate)}
                    </span>
                  )}
                </div>

                {/* Add Renew Button for expired courses */}
                {isExpired && (
                  <Button
                    variant="destructive"
                    className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleRenew}
                  >
                    Buy Again
                  </Button>
                )}
              </div>
            ) : isFree ? (
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-green-600 to-emerald-700 text-white border-0"
              >
                <Gift className="w-3.5 h-3.5 mr-1" /> Free Access
              </Badge>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                {(course.salePrice ?? 0) > 0 ? (
                  <>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(course.salePrice ?? 0)}
                    </span>
                    <span className="text-base text-gray-400 line-through">
                      {formatPrice(course.price)}
                    </span>
                    <Badge className="bg-red-600 text-white border-0">
                      Save{" "}
                      {Math.round(
                        ((course.price - (course.salePrice ?? 0)) /
                          course.price) *
                          100
                      )}
                      %
                    </Badge>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(course.price)}
                  </span>
                )}
                {/* Display validity information */}
                <div>{showValidityInfo()}</div>
              </div>
            )}
          </div>
        </div>

        {/* Link for clickable functionality, but only for non-expired courses */}
        {!isExpired && (
          <Link
            href={courseUrl}
            className="absolute inset-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <span className="sr-only">View {course.title}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
