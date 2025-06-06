"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useCustomDebounce } from "@/hooks/useCustomDebounce";
import SkeletonCardGrid from "../../_components/SkeletonCardGrid";
import { CourseDataNew } from "@/type";
import EnhancedCourseCard from "../../_components/EnhancedCourseCard";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function CoursesSection() {
  const searchParams = useSearchParams();
  const marketParam = searchParams.get("market");

  const [courses, setCourses] = useState<CourseDataNew[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("oldest");

  const debouncedSearch = useCustomDebounce(searchQuery, 500);

  // const fetchCategories = async () => {
  //     try {
  //       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/category`);
  //       if (!response.ok) throw new Error("Failed to fetch categories");
  //       const data = await response.json();
  //       if (data.success) {
  //         setCategories(data.data);
  //         // If market param exists, find and set matching category
  //         if (marketParam) {
  //           const matchingCategory = data.data.find(
  //             (cat: { name: string }) =>
  //               cat.name.toLowerCase() === marketParam.toLowerCase()
  //           );
  //           if (matchingCategory) {
  //             setSelectedCategory(matchingCategory.id);
  //           }
  //         }
  //       }
  //     } catch (error) {
  //       toast.error("Failed to load categories");
  //     }
  //   };

  const fetchCourses = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(selectedCategory !== "all" && { category: selectedCategory }),
        ...(sortBy && { sort: sortBy }),
        ...(marketParam && { market: marketParam }),
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/course/get-courses?${queryParams}`
      );

      if (!response.ok) throw new Error("Failed to fetch courses");

      const data = await response.json();
      if (data.success) {
        setCourses(data.data.courses);
        setTotalPages(data.data.totalPages);
      }
    } catch (error) {
      toast.error("An error occurred while fetching courses");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, selectedCategory, sortBy, marketParam]);

  useEffect(() => {
    // fetchCategories();
  }, [marketParam]);

  useEffect(() => {
    setIsLoading(true);
    fetchCourses();
  }, [fetchCourses]);

  // const handleReset = () => {
  //   setSearchQuery("");
  //   setSelectedCategory("all");
  //   setSortBy("oldest");
  //   setCurrentPage(1);
  // };
  return (
    <>
      {isLoading && <SkeletonCardGrid />}

      {!isLoading && courses.length > 0 && (
        <div className="px-4 py-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {courses.map((course) => (
              <EnhancedCourseCard key={course.id} course={course} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage(Math.max(currentPage - 1, 1))
                      }
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage(Math.min(currentPage + 1, totalPages))
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      )}

      {!isLoading && courses.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-gray-700">
            No courses found
          </h3>
          <p className="text-gray-500 mt-2">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </>
  );
}
