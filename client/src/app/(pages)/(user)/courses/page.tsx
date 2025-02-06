import React from "react";
import { HeroSection } from "../../_components/HeroSectionProps";
import CourseListing from "../../_components/courses/course-list";

const Course = () => {
  return (
    <>
      <HeroSection
        smallText="All Courses"
        title="Explore our courses."
        variant="page"
        image={{
          src: "/rupak-sir.webp",
          alt: "Courses",
        }}
      />
         <main className="min-h-screen bg-[#F3F8F8] px-5 py-10">
      <CourseListing />
         </main>
    </>
  );
};

export default Course;
