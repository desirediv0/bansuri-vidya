"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/helper/AuthContext";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import { ChapterDataNew } from "@/type";
import { VideoGrid } from "./VideoGrid";
import { ChapterList } from "./ChapterList";
import { ChapterForm } from "./ChapterForm";

interface ApiResponse {
  statusCode: number;
  data: string;
  message: ChapterDataNew[];
  success: boolean;
}

interface CourseChaptersProps {
  sectionSlug: string;
}

export default function CourseChapters({ sectionSlug }: CourseChaptersProps) {
  const [chapters, setChapters] = useState<ChapterDataNew[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingChapter, setEditingChapter] = useState<ChapterDataNew | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const router = useRouter();
  const { checkAuth } = useAuth();

  useEffect(() => {
    fetchCourse();
  }, [sectionSlug]);

  const fetchCourse = async () => {
    const isAuth = await checkAuth();
    if (!isAuth) {
      setIsLoading(false);
      router.push("/auth");
      return;
    }
    try {
      const response = await axios.get<ApiResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/chapter/get-all-chapter-by-section-slug/${sectionSlug}`
      );
      setChapters(response.data.message);
    } catch (error) {
      console.error("Error fetching course:", error);
      toast.error("Failed to load course");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (chapter: ChapterDataNew) => {
    setEditingChapter(chapter);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (slug: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/chapter/${slug}`);
      toast.success("Chapter deleted successfully");
      fetchCourse();
    } catch (error) {
      console.error("Error deleting chapter:", error);
      toast.error("Failed to delete chapter");
    }
  };

  const handleToggle = async (
    slug: string,
    field: "isPublished" | "isFree"
  ) => {
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/chapter/${slug}/${
          field === "isPublished" ? "publish" : "free"
        }`
      );
      toast.success(
        `Chapter ${
          field === "isPublished" ? "publication" : "access"
        } status updated`
      );
      fetchCourse();
    } catch (error) {
      console.error(`Error toggling chapter ${field}:`, error);
      toast.error(
        `Failed to update chapter ${
          field === "isPublished" ? "publication" : "access"
        } status`
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = chapters.findIndex(
      (ch) => ch.id?.toString() === active.id
    );
    const newIndex = chapters.findIndex((ch) => ch.id?.toString() === over.id);

    const reorderedChapters = arrayMove(chapters, oldIndex, newIndex).map(
      (ch, index) => ({
        ...ch,
        position: index + 1,
      })
    );

    setChapters(reorderedChapters);

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/chapter/reorder/${sectionSlug}`,
        {
          chapters: reorderedChapters.map((ch) => ({
            id: ch.id,
            position: ch.position,
          })),
        }
      );

      if (response.data.success) {
        setChapters(response.data.message);
      }
    } catch (error) {
      console.error("Error updating chapter order:", error);
      toast.error("Failed to update chapter order");
      fetchCourse();
    }
  };

  const handleCreate = async (data: Omit<ChapterDataNew, "id" | "slug">) => {
    setIsSubmitting(true);
    try {
      await axios.post<ApiResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/chapter/create/${sectionSlug}`,
        data
      );
      toast.success("Chapter created successfully");
      fetchCourse();
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating chapter:", error);
      toast.error("Failed to create chapter");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button onClick={() => setIsCreateDialogOpen(true)}>Add Chapter</Button>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Course Chapters</CardTitle>
        </CardHeader>
        <CardContent>
          <ChapterList
            chapters={chapters}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggle={handleToggle}
            onDragEnd={handleDragEnd}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Chapter Videos</CardTitle>
        </CardHeader>
        <CardContent>
          <VideoGrid chapters={chapters} isLoading={isLoading} />
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Chapter</DialogTitle>
          </DialogHeader>
          <ChapterForm
            chapter={editingChapter}
            onSubmit={async (data: Omit<ChapterDataNew, "id" | "slug">) => {
              setIsSubmitting(true);
              try {
                await axios.put<ApiResponse>(
                  `${process.env.NEXT_PUBLIC_API_URL}/chapter/${editingChapter?.slug}`,
                  data
                );
                toast.success("Chapter updated successfully");
                fetchCourse();
                setIsEditDialogOpen(false);
                setEditingChapter(null);
              } catch (error) {
                console.error("Error updating chapter:", error);
                toast.error("Failed to update chapter");
              } finally {
                setIsSubmitting(false);
              }
            }}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Chapter</DialogTitle>
          </DialogHeader>
          <ChapterForm onSubmit={handleCreate} isSubmitting={isSubmitting} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
