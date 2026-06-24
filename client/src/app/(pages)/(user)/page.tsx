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
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                }
                onClick={() => window.open('https://wa.me/919971145671', '_blank')}
                className="!px-8 py-4 bg-transparent border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-colors w-[220px] text-lg"
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
