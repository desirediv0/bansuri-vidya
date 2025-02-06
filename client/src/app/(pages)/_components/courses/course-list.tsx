"use client";

import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Category, CourseListingProps } from "@/type";
import { courses } from "./courses";
import { CourseCard } from "./CourseCard";

const categories: Category[] = ["All", "DEVELOPMENT", "DESIGN", "CLOUD"];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};


const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
};


export default function CourseListing({ defaultCategory, limit }: CourseListingProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>(defaultCategory || "All");
  const showFilter = !defaultCategory;

  const filteredCourses = courses
  .filter(
    (course) =>
      selectedCategory === "All" ||
      course.category === selectedCategory.toUpperCase()
  )
  .slice(0, limit || courses.length);


  return (
    <div className="relative">
      <div
        className="absolute top-0 left-0 w-full h-full smooth-move pointer-events-none
          before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-r 
          before:from-[#F3F8F8]/80 before:to-transparent before:z-[1]"
        style={{
          backgroundImage: "url('/c-list-b.png')",
          backgroundSize: "clamp(300px, 70%, 800px) 100%",
          backgroundPosition: "left center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="max-w-7xl mx-auto px-4 py-12 overflow-x-hidden relative z-10 overflow-y-hidden">
        <LayoutGroup>
          <div className="flex flex-col items-center space-y-8">
            <div className="flex flex-col lg:flex-row items-center justify-between w-full gap-6">
              <motion.h2
                layout
                className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 text-center lg:text-left"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Popular courses
              </motion.h2>

              {/* Category Tabs */}
              {showFilter && (
  <motion.div layout className="flex flex-wrap justify-center gap-3 md:gap-4 w-full lg:w-auto">
    {categories.map((category) => (
      <motion.button
        key={category}
        onClick={() => setSelectedCategory(category)}
                    className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full transition-all font-medium relative text-sm md:text-base
                ${
                  selectedCategory === category
                    ? "text-primary after:w-full"
                    : "text-gray-600 after:w-0"
                }
                after:content-[''] after:absolute after:left-0 after:-bottom-1 
                after:h-0.5 after:bg-primary 
                after:transition-all after:duration-300
                hover:after:w-full
              `}
                    whileTap={{ scale: 0.98 }}
                    layout
                  >
                    {category}
                  </motion.button>
                ))}
              </motion.div>
              )}
            </div>

            {/* Course Grid */}
            <motion.div
        layout
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full"
      >
        <AnimatePresence mode="popLayout">
          {filteredCourses.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course} 
              formatPrice={formatPrice}
            />
          ))}
        </AnimatePresence>
      </motion.div>

            {/* Bottom CTA */}
            <motion.p
              layout
              className="text-center text-gray-600 mt-8 md:text-lg"
            >
              We help you find the perfect tutor. It's completely free.{" "}
              <motion.a
                href="#"
                className="text-primary hover:underline font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Explore all courses →
              </motion.a>
            </motion.p>
          </div>
        </LayoutGroup>
      </div>
    </div>
  );
}
