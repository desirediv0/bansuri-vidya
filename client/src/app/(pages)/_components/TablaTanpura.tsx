"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import CustomButton from "./CustomButton";
import { AnimatedText } from "./AnimatedText";

export default function TablaTanpura() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  };

  const calculateTilt = () => {
    const tiltX = (mousePosition.y - 0.5) * 20;
    const tiltY = (mousePosition.x - 0.5) * -20;
    return `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  };

  return (
    <div>
      <div className="p-8 md:p-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Right Column */}
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="bg-[#ba1c33] p-4 rounded-full">
                <Briefcase className="w-6 h-6 text-[#fff]" />
              </div>

              <AnimatedText
                text="Enhance your Musical Journey"
                className="text-lg text-gray-700"
              />
            </div>
            <AnimatedText
              text="Practice with Tabla and Tanpura"
              className="text-4xl md:text-5xl font-bold text-gray-800 leading-tight"
            />

            <p className="text-lg md:text-md text-gray-800 leading-tight">Ready to enhance your skills and dive deeper into the world of Indian classical music? Our Tabla and Tanpura Practice Tool is here to help you master rhythm and pitch with ease. Whether you’re just beginning or looking to refine your technique, this interactive tool is perfect for students like you</p>

            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >


              <CustomButton
                primaryText="Coming Soon"
                secondaryText="Coming Soon"
                bgColor="#ba1c33"
                hoverBgColor="#111827"
                hoverTextColor="white"
                textColor="white"
                className="!w-52"
                icon={<ArrowRight className="w-5 h-5" />}
              />
            </motion.div>
          </div>
          {/* Left Column */}
          <motion.div
            className="relative w-full flex justify-center"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setMousePosition({ x: 0, y: 0 })}
            style={{
              transform: calculateTilt(),
              transition: "transform 0.3s ease-out",
            }}
          >
            {/* Main Image */}
            <motion.div
              className="relative z-20 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{ transform: "translateZ(100px)" }}
            >
              <Image
                src="/tabla-tanpura.png"
                alt="Course instructor"
                width={400}
                height={400}
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain"
                priority
              />
            </motion.div>
          </motion.div>
        </div>
      </div>

    </div>
  );
}


