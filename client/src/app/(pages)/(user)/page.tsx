"use client";

import CustomButton from "../_components/CustomButton";
import { HeroSection } from "../_components/HeroSectionProps";
import LearningLanding from "../_components/LearningLanding";
import CourseHero from "../_components/CourseHero";
import OnlineCourseSection from "../_components/courses/OnlineCourseSection";
import TestimonialsSection from "../_components/testimonial/testimonial-section";
import TablaTanpura from "../_components/TablaTanpura";

import { Phone } from "lucide-react";

export default function Home() {

  return (
    <>
      <HeroSection
        title="Start Flute Learning"
        description="Always wanted to play the flute but didn’t know where to start? Try a free trial class and feel your first beautiful note today."
        variant="home"
        image={{
          src: "/rupak-sir.webp",
          alt: "Hero image",
        }}
        scale={200}
        buttons={
          <div className="flex flex-col gap-4 w-full items-center lg:items-start">


            <div className="flex flex-row flex-wrap gap-4 justify-center lg:justify-start">
              <CustomButton
                primaryText="Book Your Free Class"
                secondaryText="Book Your Free Class"
                onClick={() => window.open('https://calendly.com/manjeet1/30min', '_blank')}
                className="!px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors w-[260px] sm:w-[260px] text-lg"
              />
              <CustomButton
                primaryText="Call Now"
                secondaryText="Call Now"
                icon={<Phone className="w-5 h-5 text-white" />}
                onClick={() => window.open('tel:+919971145671', '_self')}
                className="!px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors w-[200px] text-lg"
              />
            </div>
          </div>
        }
        stats={[
          { number: "18+", label: "Years of Experience", endValue: 18 },
          { number: "3000+", label: "Students", endValue: 3000 },
          { number: "240+", label: "Google Reviews", endValue: 240 }
        ]}
      />
      <OnlineCourseSection />
      <LearningLanding />
      <CourseHero />

      <TestimonialsSection />
      <TablaTanpura />
    </>
  );
}
