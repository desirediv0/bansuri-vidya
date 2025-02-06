"use client"

import React from "react"
import { motion } from "framer-motion"
import {
  Star,
  Clock,
  Users,
  Globe,
  Book,
  Award,
  Facebook,
  Twitter,
  Instagram,
  LinkedinIcon as LinkedIn,
  Play,
  Lock,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HeroSection } from "@/app/(pages)/_components/HeroSectionProps"
import { ReviewForm } from "./review-form"
import type { CourseContent } from "@/type"

const courseContents: CourseContent[] = [
  { title: "Introduction to Indian Cuisine", isLocked: false, isCompleted: false },
  { title: "History and regional diversity of Indian food", isLocked: true, isCompleted: false },
  { title: "Essential spices and ingredients", isLocked: true, isCompleted: false },
  { title: "Basic cooking techniques", isLocked: true, isCompleted: false },
]

const Course = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection
        smallText="Featured Course"
        title="Master Indian Cooking: From Basics to Biryani"
        variant="page"
        image={{
          src: "/rupak-sir.webp",
          alt: "Indian Cooking Course",
        }}
      />

      <div className="container mx-auto px-4 py-8 lg:py-16 max-w-7xl">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <motion.img
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src="/c1.jpg"
                  alt="Indian cuisine spread"
                  className="w-full rounded-lg mb-6"
                />

                <Tabs defaultValue="overview">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="instructor">Instructor</TabsTrigger>
                    <TabsTrigger value="review">Reviews</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-6">
                    <h3 className="text-xl font-semibold mb-4">Course Description</h3>
                    <p className="text-gray-600 mb-4">
                      Embark on a culinary journey through the rich and diverse world of Indian cuisine. This
                      comprehensive course is designed for both beginners and intermediate cooks who want to master the
                      art of Indian cooking. From the aromatic spices of the North to the coconut-infused flavors of the
                      South, you'll learn to create authentic dishes that will impress your family and friends.
                    </p>
                    <h4 className="text-lg font-semibold mb-2">What you'll learn:</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-2">
                      <li>Understanding the basics of Indian spices and their uses</li>
                      <li>Techniques for perfect rice dishes, including biryani and pulao</li>
                      <li>Mastering popular North Indian curries like Butter Chicken and Palak Paneer</li>
                      <li>Creating authentic South Indian dishes like Dosa and Sambar</li>
                      <li>The art of Indian bread making - from Naan to Paratha</li>
                      <li>Vegetarian and vegan adaptations of classic Indian recipes</li>
                    </ul>
                  </TabsContent>

                  <TabsContent value="content" className="mt-6">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="text-lg text-start">
                          Session 1: Introduction to Indian Cuisine
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="list-disc list-inside text-gray-600 space-y-2 text-base">
                            {courseContents.map((content, index) => (
                              <li
                                key={index}
                                className={`group w-full flex px-4 py-3 items-center justify-between border-b last:border-b-0 hover:bg-gray-50/80 transition-all duration-200 ${
                                  content.isLocked ? "cursor-not-allowed" : "cursor-pointer"
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="flex-shrink-0">
                                    {content.isLocked ? (
                                      <Lock className="w-4 h-4 text-gray-400" />
                                    ) : (
                                      <Play className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                                      {content.title}
                                    </p>
                                  </div>
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  disabled={content.isLocked}
                                  className={`
                                    w-8 h-8 flex items-center justify-center rounded-full
                                    ${
                                      content.isLocked
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-gray-100 group-hover:bg-[#ba1c33] group-hover:text-white"
                                    } transition-colors
                                  `}
                                >
                                  <Play className="w-4 h-4" />
                                </motion.button>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      {/* Add more AccordionItems for other sessions */}
                    </Accordion>
                  </TabsContent>

                  <TabsContent value="instructor" className="mt-6">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src="/chef-rani.jpg" alt="Chef Rani Sharma" />
                        <AvatarFallback>RS</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center justify-between w-full">
                        <h3 className="text-xl font-semibold">Chef Rani Sharma</h3>
                        <p className="text-gray-600">Master of Indian Cuisine</p>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Chef Rani Sharma brings over 20 years of culinary expertise to this course. Trained in both
                      traditional and modern Indian cooking techniques, she has worked in renowned restaurants across
                      India and has been featured on multiple cooking shows. Her passion for teaching has made her a
                      favorite among aspiring chefs and home cooks alike.
                    </p>
                    <div className="flex gap-2">
                      <Badge className="bg-[#ba1c32] text-white hover:bg-[#6d1e2a]">500+ Recipes</Badge>
                      <Badge className="bg-[#ba1c32] text-white hover:bg-[#6d1e2a]">50,000+ Students</Badge>
                      <Badge className="bg-[#ba1c32] text-white hover:bg-[#6d1e2a]">Award-Winning Chef</Badge>
                    </div>
                  </TabsContent>

                  <TabsContent value="review" className="mt-6">
                    <div className="space-y-4">
                      {[
                        {
                          name: "Priya Patel",
                          rating: 5,
                          comment:
                            "This course transformed my cooking! I can now make restaurant-quality Indian dishes at home.",
                        },
                        {
                          name: "Rahul Kapoor",
                          rating: 4,
                          comment: "Great content and easy to follow. Would love more vegetarian options.",
                        },
                        {
                          name: "Anita Desai",
                          rating: 5,
                          comment: "Chef Rani's tips and tricks are invaluable. My family loves every dish I make now!",
                        },
                      ].map((review, index) => (
                        <div key={index} className="border-b pb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar>
                              <AvatarFallback>
                                {review.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center justify-between w-full">
                              <p className="font-medium">{review.name}</p>
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-600">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                    <ReviewForm />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 mt-8 lg:mt-0 lg:absolute right-12 2xl:right-32 -bottom-[50%] xl:-bottom-[30%] block 2xl:w-[400px] bg-white p-4 rounded-xl">
            <div className="lg:sticky lg:top- space-y-4 md:space-y-6">
              {/* Video Preview Card */}
              <Card className="overflow-hidden w-full">
                <CardContent className="p-0 relative group cursor-pointer">
                  <img
                    src="/indian-cooking-preview.jpg"
                    alt="Course preview"
                    className="w-full h-40 sm:h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-all">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white flex items-center justify-center"
                    >
                      <Play className="w-6 h-6 sm:w-8 sm:h-8 text-primary ml-1" />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full">
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Course Details */}
                    <div className="w-full space-y-4">
                      {/* Duration */}
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <div className="flex items-center justify-between w-full">
                          <p className="text-sm text-gray-500">Duration</p>
                          <p className="font-medium">6 weeks</p>
                        </div>
                      </div>

                      {/* Students */}
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <div className="flex items-center justify-between w-full">
                          <p className="text-sm text-gray-500">Enrolled</p>
                          <p className="font-medium">5,234 students</p>
                        </div>
                      </div>

                      {/* Language */}
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <div className="flex items-center justify-between w-full">
                          <p className="text-sm text-gray-500">Language</p>
                          <p className="font-medium">English</p>
                        </div>
                      </div>

                      {/* Lessons */}
                      <div className="flex items-center gap-3">
                        <Book className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <div className="flex items-center justify-between w-full">
                          <p className="text-sm text-gray-500">Lessons</p>
                          <p className="font-medium">30</p>
                        </div>
                      </div>

                      {/* Certificate */}
                      <div className="flex items-center gap-3">
                        <Award className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <div className="flex items-center justify-between w-full">
                          <p className="text-sm text-gray-500">Certificate</p>
                          <p className="font-medium">Yes</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xl sm:text-2xl font-bold mb-4">
                      Price: ₹4,999
                      <span className="text-base sm:text-lg text-gray-500 line-through ml-2">₹9,999</span>
                    </p>
                    <Button className="w-full bg-[#ba1c33] text-white hover:bg-[#6d1e2a]" size="lg">
                      Enroll now
                    </Button>
                  </div>

                  <div className="flex justify-center gap-2 sm:gap-4 pt-4">
                    <Button variant="ghost" size="icon" className="p-2">
                      <Facebook className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="p-2">
                      <Twitter className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="p-2">
                      <Instagram className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="p-2">
                      <LinkedIn className="w-4 h-4 sm:w-5 sm:h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Course

