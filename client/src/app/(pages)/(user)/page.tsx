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
            <CustomButton
              primaryText="Book Your Free Class Today"
              secondaryText="Book Your Free Class Today"
              onClick={() => window.open('https://calendly.com/manjeet1/30min', '_blank')}
              className="!px-10 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors w-[300px] sm:w-[350px] text-lg"
            />
            <div className="flex flex-row flex-wrap gap-4 justify-center lg:justify-start">
              <CustomButton
                primaryText="WhatsApp Now"
                secondaryText="WhatsApp Now"
                icon={
                  <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#25D366" d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.848.502 3.578 1.377 5.084l-1.465 5.348 5.485-1.438A9.953 9.953 0 0 0 12.004 22c5.523 0 10-4.477 10-10.004S17.527 2 12.004 2z" />
                    <path fill="#FFF" d="M12 3.682c-4.588 0-8.32 3.73-8.32 8.32 0 1.637.478 3.167 1.294 4.453l-.85 3.1 3.187-.837a8.27 8.27 0 0 0 4.69 1.428c4.588 0 8.32-3.73 8.32-8.32-.002-4.59-3.733-8.322-8.32-8.322zm5.2 12.083c-.226.637-1.127 1.21-1.61 1.266-.437.05-1.002.08-2.903-.71a10.8 10.8 0 0 1-5.02-4.22c-.37-.5-.655-1.1-.655-1.726 0-1.282.668-1.92.935-2.18.232-.228.618-.344.912-.344.137 0 .256.006.356.012.3.013.45.03.644.444.243.52.83 2.03.9 2.175.07.143.118.31.02.503-.1.19-.15.31-.3.486-.15.176-.31.393-.443.528-.15.15-.306.312-.13.618a8.03 8.03 0 0 0 2.213 1.944 6.7 6.7 0 0 0 2.53 1.018c.294.056.468.012.643-.188.176-.2.756-.88.956-1.18.2-.3.4-.256.67-.156.275.1.1.883 1.763 1.688.293.143.488.243.543.344.056.1.056.575-.17 1.212z" />
                  </svg>
                }
                onClick={() => window.open('https://wa.me/919971145671', '_blank')}
                className="!px-8 py-4 bg-transparent border-2 border-[#25D366] text-white rounded-full font-semibold hover:bg-[#25D366]/10 transition-colors w-[220px] text-lg"
              />
              <CustomButton
                primaryText="Call Now"
                secondaryText="Call Now"
                icon={<Phone className="w-5 h-5 text-sky-400" />}
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
