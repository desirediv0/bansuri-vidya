"use client";

import { AnimatedDots } from "./AnimatedDots";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useCountAnimation } from "./useCountAnimation";
import { HeroSectionProps } from "@/type";
import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatedText } from "./AnimatedText";
import { log } from "console";

export function HeroSection({
  smallText,
  title,
  description,
  image,
  backgroundColor = "#000",
  buttons,
  stats,
  className,
  scale,
  variant = "page",
}: HeroSectionProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (variant !== "home") return;
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

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden w-full",
        variant === "home" ? "lg:min-h-screen" : "h-[400px] md:h-[450px]",
        className
      )}
      style={{ backgroundColor }}
    >

      <AnimatedDots />

      <div className="container relative mx-auto px-4 h-full xl:px-20">
        <div
          className={cn(
            "flex flex-col lg:flex-row h-full px-3 md:px-10",
            variant === "home"
              ? "pt-16 md:pt-20 lg:pt-16 pb-8 md:pb-12"
              : "pt-16 md:pt-20 pb-8",
            "items-center justify-center lg:items-end lg:pb-16"
          )}
        >
          {image && variant === "home" && (
            <div className="absolute inset-0 z-0 lg:hidden w-full">
              <Image
                src={image.src}
                alt={image.alt}
                layout="fill"
                objectFit="cover"
                className="opacity-30"
                priority
              />
            </div>
          )}
          <div
            className={cn(
              "w-full lg:w-1/2 space-y-4 md:space-y-6 pt-6 md:pt-8",
              variant === "home" ? "lg:max-w-3xl" : "lg:max-w-2xl",
              "text-center lg:text-left mb-8 lg:mb-0 z-10"
            )}
          >
            {smallText && (
              <AnimatedText
                text={smallText}
                className="text-lg md:text-xl text-[#fff] font-medium mb-4"
                delay={0}
              />
            )}
            <h1 className={cn(
              "font-bold text-white leading-tight mt-10 md:mt-20",
              variant === "home"
                ? "text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
                : "text-3xl md:text-5xl lg:text-6xl"
            )}>{title}</h1>
            {description && (
              <p className="mt-6 text-base sm:text-lg md:text-xl text-white/80 max-w-2xl mx-auto lg:mx-0">{description}</p>
            )}
            {buttons && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
                className={cn(
                  "mt-8 flex flex-wrap gap-5",
                  variant === "home"
                    ? "justify-center lg:justify-start"
                    : "justify-start"
                )}
              >
                {buttons}
              </motion.div>
            )}
            {stats && variant === "home" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
                className="mt-16 grid grid-cols-3 gap-4 sm:gap-8 max-w-3xl mx-auto lg:mx-0"
              >
                {stats.map((stat) => (
                  <StatCounter key={stat.label} {...stat} />
                ))}
              </motion.div>
            )}
          </div>
          {image && (
            <div
              className={cn(
                "w-full relative",
                variant === "home"
                  ? "lg:w-1/2 h-[500px] lg:h-[600px] -mb-24 ml-0 lg:ml-24"
                  : "lg:w-2/5 h-[300px] lg:h-[400px] -mb-36 ml-0 lg:ml-24",
                "hidden lg:flex items-end justify-center lg:justify-end"
              )}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className={cn(
                  "relative w-full h-full",
                  variant === "home" && "hover:scale-110"
                )}
                style={{
                  transform: variant === "home" ? calculateTilt() : undefined,
                  transformStyle: "preserve-3d",
                  transition: "all 0.3s ease-out",
                }}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={900}
                  height={900}
                  className={cn(
                    `object-contain w-full h-full scale-${scale}`,
                    variant === "home" && "transition-all duration-300"
                  )}
                  priority
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCounter({ label, endValue }: { label: string; endValue: number }) {
  const count = useCountAnimation(endValue);
  return (
    <div className="text-center">
      <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{count}+</div>
      <div className="text-xs sm:text-sm md:text-base text-white/60 mt-2">{label}</div>
    </div>
  );
}

