"use client";

import Link from "next/link";
import { DynamicTable } from "./_components/DynamicTable";
import { Button } from "@/components/ui/button";
export default function CoursesPage() {
  const columns = [
    { key: "title", label: "Title" },
    { key: "slug", label: "Slug" },
    { key: "price", label: "Price" },
  ];

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-5">
        <h1 className="text-2xl font-bold">Courses</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/create-course">
            <Button variant="outline">Add Course</Button>
          </Link>
          <Link href="/dashboard/draft-courses">
            <Button variant="outline">Draft Course</Button>
          </Link>
          <Link href="/dashboard/access-course">
            <Button variant="outline">Course Access</Button>
          </Link>
        </div>
      </div>
      <DynamicTable
        columns={columns}
        apiUrl="/course/get-courses"
        editUrl="/courses/edit"
        editChapter="/courses/edit"
      />
    </div>
  );
}
