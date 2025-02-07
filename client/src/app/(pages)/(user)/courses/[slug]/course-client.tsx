"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import axios from "axios"
import Image from "next/image"
import Link from "next/link"
import {
  PlayCircle,
  Book,
  Award,
  ChevronRight,
  Languages,
  ShoppingCart,
  AlertTriangle,
  Pause,
  Lock,
  Folder,
  Check,
} from "lucide-react"
import parse from "html-react-parser"
import { Element } from "domhandler"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/helper/AuthContext"
import { toast } from "sonner"
import ReactPlayer from "react-player"
import { ErrorComponent, LoadingSkeleton } from "./course-loading-error"
import FreeChapterDialog from "./FreeChapterDialog"
import { formatPrice } from "@/helper/FormatPrice"
import { ReviewSection } from "./review-section"

interface Chapter {
  id: string
  title: string
  isFree: boolean
  description: string
  slug: string
}
interface Category {
  id: string
  name: string
}


interface Section {
  id: string
  title: string
  chapters: Chapter[]
}

interface CourseData {
  id: string
  title: string
  description: string
  thumbnail: string
  price: number
  salePrice?: number
  paid: boolean
  language: string
  subheading: string
  videoUrl: string
  isBestseller: boolean
  isTrending: boolean
  isPopular: boolean
  isFeatured: boolean
  metaTitle: string
  metaDesc: string
  sections: Section[]
  category: Category
}

interface CourseClientProps {
  initialCourseData: CourseData
  slug: string
}

const CourseClient: React.FC<CourseClientProps> = ({ initialCourseData, slug }) => {
  const [isLoading] = useState(false)
  const [error] = useState<string | null>(null)
  const [course] = useState<CourseData>(initialCourseData)
  const [hasPurchased, setHasPurchased] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [videoError, setVideoError] = useState<string | boolean>(false)
  const { isAuthenticated } = useAuth()
  const [defaultSection, setDefaultSection] = useState<string>("")
  const playerRef = useRef<ReactPlayer>(null)
  const [isClient, setIsClient] = useState(false)
  const [selectedChapter, setSelectedChapter] = useState<{
    id: string
    title: string
  } | null>(null)
  const [freeChapterVideo, setFreeChapterVideo] = useState<string | null>(null)
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)


  useEffect(() => {
    setIsClient(true)
  }, [])

  const checkEnrollmentStatus = useCallback(async (courseId: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/enrollment/check/${courseId}`)
      return response.data.message === "Enrolled in course"
    } catch (error) {
      console.error("Error checking enrollment status:", error)
      return false
    }
  }, [])

  const checkPurchaseStatus = useCallback(async (courseId: string) => {
    try {
      const purchaseResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/purchase/${courseId}`)
      return purchaseResponse.data.data === "Course purchased"
    } catch (error) {
      console.error("Error checking purchase status:", error)
      return false
    }
  }, [])

  useEffect(() => {
    const checkEnrollmentAndPurchaseStatus = async () => {
      if (isAuthenticated) {
        if (!course.paid) {
          const enrollmentStatus = await checkEnrollmentStatus(course.id)
          setIsEnrolled(enrollmentStatus)
        } else {
          const purchaseStatus = await checkPurchaseStatus(course.id)
          setHasPurchased(purchaseStatus)
        }
      }
    }

    checkEnrollmentAndPurchaseStatus()
  }, [course, isAuthenticated, checkEnrollmentStatus, checkPurchaseStatus])

  useEffect(() => {
    const sectionsWithChapters =
      course?.sections?.filter((section) => section?.chapters && section.chapters.length > 0) || []

    const firstSectionWithChapters = sectionsWithChapters[0]
    if (firstSectionWithChapters) {
      setDefaultSection(firstSectionWithChapters.id)
    }
  }, [course])

  const handleEnrollment = async () => {
    if (!isAuthenticated) {
      window.location.href = `/auth?course-slug=${slug}`
      return
    }

    if (course.paid) {
      try {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/cart`, {
          courseId: course.id,
        })
        toast.success("Course added to cart")
        window.location.href = `/buy?course-slug=${slug}`
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          toast.error(error.response.data.message || "Error adding course to cart")
        }
      }
    } else {
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/enrollment/enroll`,
          { courseId: course.id },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          },
        )
        toast.success("Successfully enrolled in course")
        setIsEnrolled(true)
      } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
          if (error.response.data.message.includes("Already enrolled")) {
            setIsEnrolled(true)
          } else {
            toast.error(error.response.data.message || "Error enrolling in course")
          }
        }
      }
    }
  }

  const getFirstAvailableChapter = (sections: Section[]): { slug: string; id: string } | null => {
    for (const section of sections) {
      if (section.chapters && section.chapters.length > 0) {
        return {
          slug: section.chapters[0].slug,
          id: section.chapters[0].id,
        }
      }
    }
    return null
  }

  const sectionsWithChapters =
    course?.sections?.filter((section) => section?.chapters && section.chapters.length > 0) || []

  const hasSections = sectionsWithChapters.length > 0

  const renderEnrollmentButton = () => {
    if (!course) return null

    if ((course.paid && hasPurchased) || (!course.paid && isEnrolled)) {
      const firstChapter = getFirstAvailableChapter(course.sections)
      if (!firstChapter) {
        return (
          <Button className="w-full" size="lg" disabled>
            No Chapters Available
            <AlertTriangle className="w-4 h-4 ml-2" />
          </Button>
        )
      }
      return (
        <Link href={`/courses/${slug}/${firstChapter.id}`} className="block w-full">
          <Button className="w-full bg-red-500 hover:bg-red-600  text-white" size="lg">
            Continue Learning
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      )
    }
    return (
      <Button
        onClick={handleEnrollment}
        className="w-full bg-red-500 hover:bg-red-600  text-white transition-colors duration-300"
        size="lg"
        variant="default"
        disabled={!hasSections}
      >
        {course.paid ? (
          <>
            Add to Cart
            <ShoppingCart className="w-4 h-4 ml-2" />
          </>
        ) : (
          <>
            Enroll Now
            <ChevronRight className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    )
  }

  const cleanHtml = (html: string) => {
    return html
      .replace(/<(ul|ol)>\s*<\/\1>/g, "")
      .replace(/<li>\s*<\/li>/g, "")
      .replace(/<p>\s*<\/p>/g, "")
      .replace(/<[^>]*>\s*<\/[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim()
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
    setVideoError(false)
  }

  const handleChapterClick = (chapter: Chapter) => {
    // For free courses - direct navigation
    if (!course.paid) {
      if (isEnrolled) {
        window.location.href = `/courses/${slug}/${chapter.id}`
        return
      } else {
        handleEnrollment()
        return
      }
    }
    // For paid courses
    if (chapter.isFree) {
      setSelectedChapter({ id: chapter.id, title: chapter.title })
      setIsLoadingVideo(true)
      setVideoError(false)
      setFreeChapterVideo(null)

      // Get free chapter video
      axios
        .get(`${process.env.NEXT_PUBLIC_API_URL}/course/free-chapter-video/${slug}/${chapter.id}`)
        .then((response) => {
          setFreeChapterVideo(response.data.data.videoUrl)
        })
        .catch((error) => {
          setVideoError("Failed to load video. Please try again later.")
          console.error("Error loading free chapter video:", error)
        })
        .finally(() => {
          setIsLoadingVideo(false)
        })
    } else if (hasPurchased) {
      window.location.href = `/courses/${slug}/${chapter.id}`
    }
  }

  if (isLoading) return <LoadingSkeleton />
  if (error) return <ErrorComponent error={error} />

  return (
    <div className="min-h-screen bg-gray-50 font-plus-jakarta-sans">
      {/* Course Header */}
      <div className="bg-gradient-to-t from-[#ef5252] to-[#000000c1] text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="container mx-auto px-4 py-12 md:py-16 max-w-7xl relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Course Info */}
            <div className="order-2 md:order-1 space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {course.isBestseller && (
                  <Badge variant="secondary" className="bg-yellow-400/20 text-yellow-200 border-yellow-400/40">
                    <Award className="w-4 h-4 mr-1" /> Bestseller
                  </Badge>
                )}
                {course.isTrending && (
                  <Badge variant="secondary" className="bg-blue-400/20 text-blue-200 border-blue-400/40">
                    📈 Trending
                  </Badge>
                )}
                {course.isPopular && (
                  <Badge variant="secondary" className="bg-green-400/20 text-green-200 border-green-400/40">
                    🔥 Popular
                  </Badge>
                )}
                {course.isFeatured && (
                  <Badge variant="secondary" className="bg-purple-400/20 text-purple-200 border-purple-400/40">
                    ⭐ Featured
                  </Badge>
                )}
              </div>

              {/* Title & Subheading */}
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold capitalize leading-tight">
                  {course.title}
                </h1>
                {course.subheading && (
                  <p className="text-lg md:text-xl text-white/80 font-medium">
                    {course.subheading}
                  </p>
                )}
              </div>

              {/* Course Meta Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Book className="w-5 h-5 text-white/80" />
                    <span className="text-lg font-medium">
                      {sectionsWithChapters.reduce((total, section) => total + section.chapters.length, 0)} Chapters
                    </span>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Languages className="w-5 h-5 text-white/80" />
                    <span className="text-lg font-medium capitalize">
                      {course.language}
                    </span>
                  </div>
                </div>

                {course.category && (
                  <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <Folder className="w-5 h-5 text-white/80" />
                      <span className="text-lg font-medium">
                        {course.category.name}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Video/Thumbnail */}
            <div className="order-1 md:order-2">
              <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/20">
                {/* Thumbnail Image - Always visible when not playing */}
                <div className={`absolute inset-0 transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
                  <Image
                    src={`${process.env.NEXT_PUBLIC_IMAGE_URL}/${course.thumbnail}`}
                    alt={course.title}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 hover:scale-105"
                  />
                </div>

                {/* Video Player - Only visible when playing */}
                {isClient && course.videoUrl && (
                  <div className={`absolute inset-0 transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}>
                    <ReactPlayer
                      ref={playerRef}
                      url={course.videoUrl}
                      width="100%"
                      height="100%"
                      playing={isPlaying}
                      controls={false}
                      onPause={() => setIsPlaying(false)}
                      onPlay={() => setIsPlaying(true)}
                      onError={() => setVideoError(true)}
                      className="rounded-xl overflow-hidden"
                    />
                  </div>
                )}

                {/* Play/Pause Overlay */}
                {!videoError && (
                  <button
                    onClick={togglePlayPause}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-all duration-300"
                  >
                    {isPlaying ? (
                      <Pause className="w-20 h-20 text-white transition-transform hover:scale-110" />
                    ) : (
                      <PlayCircle className="w-20 h-20 text-white transition-transform hover:scale-110" />
                    )}
                  </button>
                )}

                {/* Error Message */}
                {videoError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
                    <p>Sorry, the video could not be played.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Course Description & Content (second on mobile) */}
          <div className="md:col-span-2 order-2 md:order-none">
            {/* Course Description Card */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Course Description</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg dark:prose-invert">
                {course.description
                  ? parse(cleanHtml(course.description), {
                    replace: (domNode) => {
                      if (
                        domNode instanceof Element &&
                        (!domNode.children?.length ||
                          (domNode.children.length === 1 &&
                            "data" in domNode.children[0] &&
                            !domNode.children[0].data?.trim()))
                      ) {
                        return <></>
                      }
                      return domNode
                    },
                  })
                  : "No description available"}
              </CardContent>
            </Card>

            {/* Course Content Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Course Content</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" defaultValue={defaultSection} collapsible className="space-y-4">
                  {sectionsWithChapters.length > 0 ? (
                    sectionsWithChapters.map((section, sectionIndex) => (
                      <AccordionItem key={section.id} value={section.id} className="border rounded-lg">
                        <AccordionTrigger className="px-4 py-3 bg-gray-50 hover:bg-gray-100">
                          <div className="flex items-center gap-3">
                            <span className="text-red-600 font-semibold">Section {sectionIndex + 1}:</span>
                            <span className="font-medium">{section.title}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 p-4">
                            <div className="space-y-2">
                              {section.chapters.map((chapter) => (
                                <div
                                  key={chapter.id}
                                  className={`flex flex-col gap-2 p-3 rounded-lg transition-all duration-200 border ${(!course.paid && isEnrolled) || chapter.isFree || hasPurchased
                                    ? "hover:bg-gray-50 cursor-pointer"
                                    : "opacity-90 bg-gray-50"
                                    }`}
                                  onClick={() => handleChapterClick(chapter)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      {chapter.isFree ||
                                        (course.paid && hasPurchased) ||
                                        (!course.paid && isEnrolled) ? (
                                        <PlayCircle className="w-5 h-5 text-red-600" />
                                      ) : (
                                        <Lock className="w-5 h-5 text-gray-400" />
                                      )}
                                      <span
                                        className={`font-medium ${chapter.isFree ||
                                          (course.paid && hasPurchased) ||
                                          (!course.paid && isEnrolled)
                                          ? ""
                                          : "text-gray-800"
                                          }`}
                                      >
                                        {chapter.title}
                                      </span>
                                    </div>
                                    <Badge
                                      variant={
                                        chapter.isFree
                                          ? "secondary"
                                          : (course.paid && hasPurchased) || (!course.paid && isEnrolled)
                                            ? "default"
                                            : "outline"
                                      }
                                      className={
                                        chapter.isFree
                                          ? "bg-green-100 text-green-800"
                                          : (course.paid && hasPurchased) || (!course.paid && isEnrolled)
                                            ? "bg-red-600 text-white"
                                            : "text-gray-700"
                                      }
                                    >
                                      {chapter.isFree
                                        ? "Free"
                                        : (course.paid && hasPurchased) || (!course.paid && isEnrolled)
                                          ? "Enrolled"
                                          : "Premium"}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                      <p className="text-lg font-semibold text-gray-700">No content available</p>
                      <p className="text-gray-500">This course doesn&apos;t have any sections or chapters yet.</p>
                    </div>
                  )}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Price Card (first on mobile) */}
          <div className="md:col-span-1 order-1 md:order-none">

            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>
                  {(course.paid && hasPurchased) || (!course.paid && isEnrolled) ? (
                    <div className="space-y-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800 text-base px-4 py-1">
                        <Check className="w-4 h-4 mr-2" />
                        Continue Learning
                      </Badge>
                      {/* <div className="mt-4">
                        <div className="h-2 w-full bg-gray-100 rounded-full">
                          <div className="h-full bg-green-500 rounded-full w-[0%]" />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">0% Complete</p>
                      </div> */}
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-2">
                      {course.paid ? (
                        <div>
                          <span className="text-3xl font-bold text-red-600">
                            {formatPrice(course.price)}
                          </span>
                          <Badge variant="secondary" className="text-sm ml-2">PAID</Badge>
                        </div>
                      ) : (
                        <span className="text-3xl font-bold text-green-600">FREE</span>
                      )}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderEnrollmentButton()}
                {(!course.paid && isEnrolled) || (course.paid && hasPurchased) ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Your Progress</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2 text-gray-600">
                        <Book className="w-5 h-5 text-green-600" />
                        Enrolled Course
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <Award className="w-5 h-5 text-green-600" />
                        Certificate Available on Completion
                      </li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-semibold">This course includes:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2 text-gray-600">
                        <PlayCircle className="w-5 h-5 text-red-600" />
                        {sectionsWithChapters.reduce((total, section) => total + section.chapters.length, 0)} chapters
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <Book className="w-5 h-5 text-red-600" />
                        Full lifetime access
                      </li>
                      <li className="flex items-center gap-2 text-gray-600">
                        <Award className="w-5 h-5 text-red-600" />
                        Certificate of completion
                      </li>
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="py-8">
          <ReviewSection
            courseId={course.id}
            isEnrolled={isEnrolled}
            hasPurchased={hasPurchased}

          />
        </div>
      </div>

      {course.paid && (
        <FreeChapterDialog
          isOpen={!!selectedChapter}
          onClose={() => {
            setSelectedChapter(null)
            setFreeChapterVideo(null)
            setVideoError(false)
          }}
          chapterTitle={selectedChapter?.title || ""}
          videoUrl={freeChapterVideo}
          isLoading={isLoadingVideo}
          error={videoError}
        />
      )}
    </div>
  )
}

export default CourseClient

