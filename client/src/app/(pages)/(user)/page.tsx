import { ThumbsUp, Youtube } from "lucide-react";
import CustomButton from "../_components/CustomButton";
import { HeroSection } from "../_components/HeroSectionProps";
import Link from "next/link";
import LearningLanding from "../_components/LearningLanding";
import CourseHero from "../_components/CourseHero";
import TestimonialsSection from "../_components/testimonial/testimonial-section";
import TablaTanpura from "../_components/TablaTanpura";
import LearningStyle from "../_components/courses/learningStyle";

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
        buttons={
          <>
            <CustomButton
              primaryText="Get Started"
              secondaryText="Learn More"
              icon={<ThumbsUp size={20} />}
              className="!px-6 py-3 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors w-[200px]"
            />
            <Link
              href="/about"
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
            </Link>
          </>
        }
        stats={[
          { number: "260+", label: "Tutors", endValue: 260 },
          { number: "9000+", label: "Students", endValue: 9000 },
          { number: "500+", label: "Courses", endValue: 500 }
        ]}
      />
      <LearningLanding />
      <main className="min-h-screen bg-[#F3F8F8] px-5 py-10">
        <LearningStyle />
      </main>
      <CourseHero />
      <TestimonialsSection />
      <TablaTanpura />
    </>
  );
}
