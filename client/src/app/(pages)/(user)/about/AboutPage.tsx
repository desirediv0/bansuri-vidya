'use client'

import { Award } from 'lucide-react'
import Image from 'next/image'
import { AnimatedText } from '../../_components/AnimatedText'
import { motion } from 'framer-motion'


export default function AboutPage() {
  return (
    <div className="relative overflow-hidden bg-white">
      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="grid gap-8 md:gap-16 lg:grid-cols-2 px-4 md:px-8 xl:px-20">
          {/* Left Column */}
          <motion.div
            className="flex flex-col justify-center space-y-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Image
                src="/l-1.png"
                alt="Decorative Image 1"
                width={100}
                height={100}
                className="absolute top-0 left-0 h-auto w-64 md:w-96 z-10"
              />
            </motion.div>

            <motion.div
              className="flex w-fit items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex p-4 items-center justify-center rounded-full bg-[#ba1c33]">
                <Award size={24} color="#fff" />
              </div>
              <AnimatedText
                text="About Us"
                className="text-lg font-medium text-[#107D6C]"
                delay={0.5}
              />
            </motion.div>

            <AnimatedText
              text="Harmonizing Tradition with Melody"
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-[var(--custom-green-11)]"
              delay={0.2}
            />


          </motion.div>

          {/* Right Column */}
          <motion.div
            className="relative space-y-8 md:space-y-12 pt-8 lg:pt-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Image
              src="/l-2.png"
              alt="Decorative Image 2"
              width={150}
              height={150}
              className="absolute top-1/2 -right-20 md:-right-56 -translate-y-1/2 h-auto w-60 md:w-80 rotate-[-55deg] opacity-5"
            />
            <div className="flex flex-col space-y-6 md:space-y-8">
              <AnimatedText
                text="Welcome to Bansuri Vidya Mandir"
                className="text-2xl md:text-3xl font-semibold text-gray-800"
                delay={0.4}
              />

              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                Bansuri Vidya Mandir is a sacred space where the timeless tunes of the Indian flute meet the rhythm of education. Our institution is dedicated to nurturing musical talent and imparting the profound art of bansuri playing, blending academic excellence, cultural heritage, and spiritual growth.
              </p>

            </div>
          </motion.div>
        </div>
      </div>

    </div>
  )
}