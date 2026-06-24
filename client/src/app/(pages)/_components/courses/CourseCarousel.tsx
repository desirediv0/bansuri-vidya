"use client";
import React, { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { CourseDataNew } from "@/type";
import EnhancedCourseCard from "../EnhancedCourseCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CourseCarousel() {
  const [courses, setCourses] = useState<CourseDataNew[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  const fetchCourses = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/course/get-courses?page=1&limit=20`
      );
      if (!response.ok) throw new Error("Failed to fetch courses");
      const data = await response.json();
      if (data.success) {
        setCourses(data.data.courses);
      }
    } catch (error) {
      toast.error("Failed to load courses");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Auto Scroll logic
  useEffect(() => {
    if (isLoading || courses.length === 0 || isPaused) return;

    const interval = setInterval(() => {
      if (containerRef.current) {
        const container = containerRef.current;
        const scrollAmount = 344; // Card width + gap
        const maxScroll = container.scrollWidth - container.clientWidth;

        if (container.scrollLeft >= maxScroll - 5) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          container.scrollBy({ left: scrollAmount, behavior: "smooth" });
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLoading, courses, isPaused]);

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const container = containerRef.current;
      const scrollAmount = 344;
      if (direction === "left") {
        container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex gap-6 overflow-hidden py-4 max-w-7xl mx-auto w-full px-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-w-[280px] h-[380px] bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return null;
  }

  const displayCourses = [...courses, ...courses];

  return (
    <div 
      className="relative w-full max-w-7xl mx-auto px-4 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Navigation Buttons */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-gray-100"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-gray-100"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Carousel Container */}
      <div
        ref={containerRef}
        className="flex gap-6 overflow-x-auto py-6 scroll-smooth no-scrollbar"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {displayCourses.map((course, idx) => (
          <div key={`${course.id}-${idx}`} className="min-w-[320px] transition-transform duration-300 hover:scale-[1.02]">
            <EnhancedCourseCard course={course} />
          </div>
        ))}
      </div>
    </div>
  );
}
