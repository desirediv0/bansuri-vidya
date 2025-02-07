"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Award, TrendingUp, Flame, Star, BookOpen, Gift, Folder, Check } from "lucide-react"
import { formatPrice } from "@/helper/FormatPrice"
import { CourseCardProps } from "@/type"
import parse from "html-react-parser"
import { Progress } from "@/components/ui/progress"

const BadgeStyles = {
  bestseller: "bg-yellow-400/20 text-yellow-200 border-yellow-400/40",
  trending: "bg-blue-400/50  border-blue-400/40 text-blue-200",
  popular: "bg-green-400/20 text-green-200 border-green-400/40",
  featured: "bg-purple-400/20 text-purple-200 border-purple-400/40",
}

export default function EnhancedCourseCard({ course, hidePrice = false }: CourseCardProps & { hidePrice?: boolean }) {
  const [isHovered, setIsHovered] = useState(false)
  const isFree = !course.paid
  const [courseProgress, setCourseProgress] = useState<{
    percentage: number;
    completedChapters: number;
    totalChapters: number;
  }>({
    percentage: 0,
    completedChapters: 0,
    totalChapters: 0
  });

  useEffect(() => {
    if (hidePrice) {
      const fetchCourseProgress = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/user-progress/course/${course.id}`,
            {
              credentials: 'include',
            }
          );
          const data = await response.json();
          if (data.success) {
            setCourseProgress({
              percentage: data.data.percentage || 0,
              completedChapters: data.data.completedCount || 0,
              totalChapters: data.data.totalChapters || 0
            });
          }
        } catch (error) {
          console.error("Failed to fetch course progress:", error);
        }
      };

      fetchCourseProgress();
    }
  }, [course.id, hidePrice]);

  // Determine the correct URL based on hidePrice (enrolled/purchased status)
  const courseUrl = hidePrice
    ? `/courses/${course.slug}/${course.id}` // For enrolled/purchased courses - go to course player
    : `/courses/${course.slug}`              // For non-enrolled courses - go to course details

  return (
    <Link
      href={courseUrl}
      className="block perspective-1000"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative transform-gpu transition-all duration-500 h-[500px] w-full max-w-[422px] mx-auto`}>
        <div className="relative h-full w-full  shadow-xl">

          {/* Badge Container - Above image */}
          <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap gap-2">
            {course.isBestseller && (
              <Badge variant="secondary" className={`transition-all ${BadgeStyles.bestseller}`}>
                <Award className="w-4 h-4 mr-1" /> Bestseller
              </Badge>
            )}
            {course.isTrending && (
              <Badge variant="secondary" className={`transition-all ${BadgeStyles.trending}`}>
                <TrendingUp className="w-4 h-4 mr-1" /> Trending
              </Badge>
            )}
            {course.isPopular && (
              <Badge variant="secondary" className={`transition-all ${BadgeStyles.popular}`}>
                <Flame className="w-4 h-4 mr-1" /> Popular
              </Badge>
            )}
            {course.isFeatured && (
              <Badge variant="secondary" className={`transition-all ${BadgeStyles.featured}`}>
                <Star className="w-4 h-4 mr-1" /> Featured
              </Badge>
            )}
          </div>

          {/* Thumbnail Container */}
          <div className="relative h-[220px] overflow-hidden rounded-t-xl">
            <Image
              src={course.thumbnail ? `${process.env.NEXT_PUBLIC_IMAGE_URL}/${course.thumbnail}` : "/placeholder.jpeg"}
              alt={course.title}
              fill
              className={`object-cover transition-all duration-700 ${isHovered ? "scale-110 blur-sm brightness-75" : "scale-100"}`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080b11] via-slate-900/50 to-transparent opacity-80" />
          </div>

          {/* Content Section */}
          <div className="relative p-4 space-y-4">
            {/* Title */}
            <h3 className="text-xl font-bold text-gray-800 line-clamp-2 capitalize">
              {course.title}
            </h3>

            {/* Description */}
            <div className={`text-base text-gray-600 line-clamp-3 transition-all duration-300 ${isHovered ? "opacity-100" : "opacity-90"}`}>
              {parse(course.description ?? "")}
            </div>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <Badge variant="outline" className="bg-white/90 text-gray-700 border-gray-200 shadow-sm uppercase">
                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                {course.language}
              </Badge>
              <Badge variant="outline" className="bg-white/90 text-gray-700 border-gray-200 shadow-sm uppercase">
                <Folder className="w-3.5 h-3.5 mr-1.5" />
                {course?.category?.name}
              </Badge>
            </div>

            {/* Price Section or Progress Badge */}
            <div className="pt-4 mt-2 border-t border-gray-100">
              {hidePrice ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-sm">
                      <Check className="w-4 h-4 mr-1.5" /> Enrolled
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {courseProgress.completedChapters}/{courseProgress.totalChapters} Chapters
                    </span>
                  </div>
                  <Progress value={courseProgress.percentage} className="h-2" />
                  <span className="text-xs text-gray-600">{Math.round(courseProgress.percentage)}% Complete</span>
                </div>
              ) : isFree ? (
                <Badge variant="secondary" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-sm">
                  <Gift className="w-4 h-4 mr-1.5" /> Free Access
                </Badge>
              ) : (
                <div className="flex items-center gap-3">
                  {(course.salePrice ?? 0) > 0 ? (
                    <>
                      <span className="text-2xl font-bold text-gray-900">
                        {formatPrice(course.salePrice ?? 0)}
                      </span>
                      <span className="text-base text-gray-400 line-through decoration-red-500/50">
                        {formatPrice(course.price)}
                      </span>
                      <Badge className="bg-red-500/90 text-white border-0 text-center">
                        Save {Math.round(((course.price - (course.salePrice ?? 0)) / course.price) * 100)}%
                      </Badge>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-gray-900">
                      {formatPrice(course.price)}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Hover Effect */}
          <div className={`absolute inset-0 bg-gradient-to-t from-red-950/40 via-black/20 to-transparent 
            opacity-0 transition-opacity duration-300 rounded-xl ${isHovered ? "opacity-60" : ""}`} />
        </div>
      </div>
    </Link>
  )
}