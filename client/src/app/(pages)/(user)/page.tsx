"use client";

import CustomButton from "../_components/CustomButton";
import { HeroSection } from "../_components/HeroSectionProps";
import LearningLanding from "../_components/LearningLanding";
import CourseHero from "../_components/CourseHero";
import TestimonialsSection from "../_components/testimonial/testimonial-section";
import TablaTanpura from "../_components/TablaTanpura";

export default function Home() {

  return (
    <>
      <HeroSection
        title="Your Journey to Flute Mastery Begins Here"
        description="Embark on your journey to flute mastery with our pre-recorded courses, interactive live classes, and immersive offline batches designed to suit every learner's needs."
        variant="home"
        image={{
          src: "/rupak-sir.webp",
          alt: "Hero image",
        }}
        scale={200}
        buttons={
          <CustomButton
            primaryText="Book Your Free Class Today"
            secondaryText="Book Your Free Class Today"
            onClick={() => window.open('https://calendly.com/manjeet1/30min', '_blank')}
            className="!px-10 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors w-[300px] text-lg"
          />
        }
        stats={[
          { number: "18+", label: "Years of Experience", endValue: 18 },
          { number: "3000+", label: "Students", endValue: 3000 },
          { number: "240+", label: "Google Reviews", endValue: 240 }
        ]}
      />
      <LearningLanding />

      <CourseHero />
      <TestimonialsSection />
      <TablaTanpura />
    </>
  );
}
