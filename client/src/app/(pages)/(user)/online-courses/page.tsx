// "use client";
// import { ThumbsUp, Youtube } from "lucide-react";
// import CustomButton from "../../_components/CustomButton";
// import CourseHero from "../../_components/CourseHero";
// import TestimonialsSection from "../../_components/testimonial/testimonial-section";
// import TablaTanpura from "../../_components/TablaTanpura";
// import { HeroSection } from "../../_components/HeroSectionProps";
// import OnlineCourseSection from "../../_components/courses/OnlineCourseSection";
// import { useState } from "react";
// import VideoDialog from "../../_components/VideoDialog";
// import { scrollToSection } from "../../_components/smoothScroll";

// export default function OnlineCourses() {
//   const [isVideoOpen, setIsVideoOpen] = useState(false);

//   return (
//     <>
//       <HeroSection
//         title="Online Courses"
//         description="At Bansuri Vidya Mandir, we believe in making quality education accessible to everyone, anytime, anywhere. Our Online Courses are designed to provide a flexible and engaging learning experience, ensuring that students receive the best education from the comfort of their homes."
//         variant="page"
//         backgroundImage="/online-course-n.png"
//         buttons={
//           <>
//             <CustomButton
//               primaryText="Get Started"
//               secondaryText="Learn More"
//               icon={<ThumbsUp size={20} />}
//               onClick={() => scrollToSection("courses-section")}
//               className="!px-6 py-3 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors w-[200px]"
//             />
//             <button
//               onClick={() => setIsVideoOpen(true)}
//               className="group flex items-center justify-center text-white gap-1
//               hover:text-white/90 transition-all duration-300 relative
//               hover:-translate-x-2"
//             >
//               <Youtube
//                 size={20}
//                 className="transform transition-all duration-300 
//                 group-hover:translate-x-[-2px]"
//               />
//               <span>How it works</span>
//             </button>
//           </>
//         }
//         stats={[
//           { number: "1200+", label: "Students Enrolled", endValue: 1200 },
//           { number: "240+", label: "5 Star Google Reviews", endValue: 240 },
//           { number: "20", label: "Years of Experience", endValue: 20 }
//         ]}
//       />
//       <VideoDialog
//         isOpen={isVideoOpen}
//         onClose={() => setIsVideoOpen(false)}
//         videoUrl="https://www.youtube.com/watch?v=9Jk5C2cgPQU"
//       />
//       <main className="min-h-screen bg-[#F3F8F8] px-5 pb-6">
//         <div id="courses-section">
//           <OnlineCourseSection />
//         </div>
//       </main>
//       <CourseHero />
//       <TestimonialsSection />
//       <TablaTanpura />
//     </>
//   );
// }


"use client";
import { HeroSection } from "../../_components/HeroSectionProps";
import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from 'next/navigation';
import { toast } from "sonner";
import { CourseDataNew } from "@/type";
import SkeletonCardGrid from "../../_components/SkeletonCardGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, ThumbsUp, Youtube } from "lucide-react";
import { useCustomDebounce } from "@/hooks/useCustomDebounce";
import CourseCards from "../../_components/CourseCards";
import CustomButton from "../../_components/CustomButton";
import VideoDialog from "../../_components/VideoDialog";
import { scrollToSection } from "../../_components/smoothScroll";

const Course = () => {
  const searchParams = useSearchParams();
  const marketParam = searchParams.get('market');

  const [courses, setCourses] = useState<CourseDataNew[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("oldest");
  const [categories, setCategories] = useState<{ id: string; name: string; }[]>([]);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const debouncedSearch = useCustomDebounce(searchQuery, 500);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/category`);
      if (!response.ok) throw new Error("Failed to fetch categories");
      const data = await response.json();
      if (data.success) {
        setCategories(data.data);
        // If market param exists, find and set matching category
        if (marketParam) {
          const matchingCategory = data.data.find(
            (cat: { name: string }) =>
              cat.name.toLowerCase() === marketParam.toLowerCase()
          );
          if (matchingCategory) {
            setSelectedCategory(matchingCategory.id);
          }
        }
      }
    } catch (error) {
      toast.error("Failed to load categories");
    }
  };

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
    fetchCategories();
  }, [marketParam]);

  useEffect(() => {
    setIsLoading(true);
    fetchCourses();
  }, [fetchCourses]);

  const handleReset = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("oldest");
    setCurrentPage(1);
  };


  return (
    <>
      <HeroSection
        title="Online Courses"
        description="At Bansuri Vidya Mandir, we believe in making quality education accessible to everyone, anytime, anywhere. Our Online Courses are designed to provide a flexible and engaging learning experience, ensuring that students receive the best education from the comfort of their homes."
        variant="page"
        backgroundImage="/online-course-n.png"
        buttons={
          <>
            <CustomButton
              primaryText="Get Started"
              secondaryText="Learn More"
              icon={<ThumbsUp size={20} />}
              onClick={() => scrollToSection("courses-section")}
              className="!px-6 py-3 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors w-[200px]"
            />
            <button
              onClick={() => setIsVideoOpen(true)}
              className="group flex items-center justify-center text-white gap-1
              hover:text-white/90 transition-all duration-300 relative
              hover:-translate-x-2"
            >
              <Youtube
                size={20}
                className="transform transition-all duration-300 
                group-hover:translate-x-[-2px]"
              />
              <span>How it works</span>
            </button>
          </>
        }
        stats={[
          { number: "1200+", label: "Students Enrolled", endValue: 1200 },
          { number: "240+", label: "5 Star Google Reviews", endValue: 240 },
          { number: "20", label: "Years of Experience", endValue: 20 }
        ]}
      />
      <VideoDialog
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        videoUrl="https://www.youtube.com/watch?v=9Jk5C2cgPQU"
      />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col gap-4 mb-8" id="courses-section" >
          <div className="w-full">
            <div className="relative">
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 w-full"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <div className="flex flex-col sm:flex-row gap-4 flex-grow">
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={handleReset}
              className="w-full sm:w-auto"
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Reset Filters
            </Button>
          </div>
        </div>

        {isLoading && <SkeletonCardGrid />}

        {!isLoading && courses.length > 0 && (
          <CourseCards
            courses={courses}
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        )}

        {!isLoading && courses.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-700">No courses found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </>
  );
};

export default Course;
