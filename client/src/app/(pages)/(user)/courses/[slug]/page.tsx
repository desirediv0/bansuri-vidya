import { Metadata } from "next";
import CourseClient from "./course-client";
import { AlertTriangle } from "lucide-react";

async function getCourse(slug: string) {
  try {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      throw new Error("API URL not configured");
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/course/get-course-page/${slug}`,
      {
        next: { revalidate: 0 },
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      }
    );

    if (!res.ok) {
      console.error("API Error:", {
        status: res.status,
        statusText: res.statusText,
        url: res.url
      });
      throw new Error(`Failed to fetch course: ${res.status}`);
    }

    const data = await res.json();

    if (!data || !data.data) {
      console.error("Invalid API response:", data);
      throw new Error("Invalid response format");
    }

    return data;
  } catch (error) {
    console.error("Error fetching course:", error);
    return {
      error: true,
      message: "Failed to fetch course",
      data: {}
    };
  }
}

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const courseData = await getCourse(params.slug);

  if (courseData.error) {
    return {
      title: "Error | Bansuri Vidya Mandir | Indian Classical Music Institute",
      description: "Course not found",
    };
  }

  return {
    title:
      courseData.data.metaTitle || courseData.data.title || "Bansuri Vidya Mandir | Indian Classical Music Institute",
    description:
      courseData.data.metaDesc ||
      "Empower your financial future with expert training in Indian classical music.",
  };
}

export default async function CoursePage({ params }: Props) {
  const courseData = await getCourse(params.slug);

  if (courseData.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8 font-plus-jakarta-sans">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex flex-col items-center justify-center">
            <AlertTriangle className="h-16 w-16 text-yellow-400 animate-bounce" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Oops! Course Not Found
            </h2>
            <p className="mt-2 text-sm text-gray-600 font-inter">
              We couldn&apos;t find the course you&apos;re looking for. It might
              have been moved or deleted.
            </p>
            <div className="mt-6">
              <a
                href="/courses"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm bg-red-600 hover:bg-red-700 hover:text-white text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Browse All Courses
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CourseClient initialCourseData={courseData.data} slug={params.slug} />
  );
}
