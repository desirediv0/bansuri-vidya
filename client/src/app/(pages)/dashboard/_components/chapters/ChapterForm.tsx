import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { ChapterDataNew } from "@/type";

interface ChapterFormProps {
  chapter?: ChapterDataNew | null;
  onSubmit: (data: Omit<ChapterDataNew, "id" | "slug">) => Promise<void>;
  isSubmitting: boolean;
}

export function ChapterForm({
  chapter,
  onSubmit,
  isSubmitting,
}: ChapterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Omit<ChapterDataNew, "id" | "slug">>({
    defaultValues: chapter
      ? {
          title: chapter.title,
          description: chapter.description,
          videoUrl: chapter.videoUrl,
          isFree: chapter.isFree,
          isPublished: chapter.isPublished,
        }
      : {},
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <Input
          id="title"
          {...register("title", { required: "Title is required" })}
          className="w-full"
        />
        {errors.title && (
          <p className="text-red-500 text-xs">{errors.title.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="description"
          {...register("description", { required: "Description is required" })}
          className="w-full"
        />
        {errors.description && (
          <p className="text-red-500 text-xs">{errors.description.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <label htmlFor="videoUrl" className="text-sm font-medium">
          Video URL
        </label>
        <Input
          id="videoUrl"
          type="url"
          {...register("videoUrl", {
            required: "Video URL is required",
          })}
          className="w-full"
        />
        {errors.videoUrl && (
          <p className="text-red-500 text-xs">{errors.videoUrl.message}</p>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {chapter ? "Updating..." : "Creating..."}
          </>
        ) : chapter ? (
          "Update Chapter"
        ) : (
          "Create Chapter"
        )}
      </Button>
    </form>
  );
}
