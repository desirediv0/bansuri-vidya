"use client";

import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { SquareCard } from "./squareCard";
import { courses } from "./courses";


const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};



export default function LearningStyle() {

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
                                className="text-3xl md:text-4xl lg:text-5xl font-semibold text-gray-900 text-center lg:text-left pb-8"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                Choose your Learning Style
                            </motion.h2>
                        </div>

                        {/* Course Grid */}
                        <motion.div
                            layout
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
                        >
                            <AnimatePresence mode="popLayout">
                                {courses.map((course) => (
                                    <SquareCard
                                        key={course.id}
                                        course={course}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </LayoutGroup>
            </div>
        </div>
    );
}