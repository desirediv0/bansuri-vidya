"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Image from "next/image";
import { CourseCardProps } from "@/type";
import Link from "next/link";

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};



export function CourseCard({ course, formatPrice }: CourseCardProps) {
  return (
    <Link href={`/courses/test-course`}>
    <motion.div
      layoutId={course.id}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300"
    >
      {/* Course Image */}
      <div className="relative h-48">
        <Image
          src={course.image}
          alt={course.title}
          layout="fill"
          objectFit="cover"
        />
        <motion.div
          className="absolute -bottom-7 right-4 bg-[var(--custom-green-1)] text-white w-16 h-16 rounded-full 
          font-medium flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
        >
          {formatPrice(course.price)}
        </motion.div>
      </div>

      {/* Course Content */}
      <div className="p-6 space-y-4">
        <div className="flex items-center text-sm text-gray-500">
          <span className="uppercase font-medium">{course.category}</span>
          <span className="mx-2">•</span>
          <span>{course.instructor}</span>
        </div>

        <h3 className="text-lg font-semibold leading-tight line-clamp-2">
          {course.title}
        </h3>

        {/* Rating */}
        <div className="flex items-center">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
              >
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </motion.div>
            ))}
          </div>
          <span className="ml-2 text-sm text-gray-600">
            ({course.reviews} Reviews)
          </span>
        </div>

        {/* Course Details */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
          <motion.div className="flex items-center" whileHover={{ scale: 1.05 }}>
            <span>{course.lessons} Lessons</span>
          </motion.div>
          <motion.div className="flex items-center" whileHover={{ scale: 1.05 }}>
            <span>{course.students} Students</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
     </Link>
  );
}