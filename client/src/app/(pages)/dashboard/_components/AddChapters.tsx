"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChapterFormData, ChapterFormPropsSecond } from "@/type";

function ChapterForm({
  onSubmit,
  submitButtonText,
  isSubmitting,
}: ChapterFormPropsSecond) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<{ chapters: ChapterFormData[] }>({
    defaultValues: {
      chapters: [
        {
          title: "",
          description: "",
          videoUrl: "",
          isFree: false,
          isPublished: false,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "chapters",
  });

  const onSubmitForm = (data: { chapters: ChapterFormData[] }) => {
    onSubmit(data.chapters);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-8">
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-4 p-4 border rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Chapter {index + 1}</h3>
            {index > 0 && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`chapters.${index}.title`}>Title</Label>
            <Input
              id={`chapters.${index}.title`}
              {...register(`chapters.${index}.title` as const, {
                required: "Title is required",
              })}
            />
            {errors.chapters?.[index]?.title && (
              <p className="text-sm text-destructive">
                {errors.chapters[index]?.title?.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`chapters.${index}.description`}>Description</Label>
            <Textarea
              id={`chapters.${index}.description`}
              {...register(`chapters.${index}.description` as const, {
                required: "Description is required",
              })}
            />
            {errors.chapters?.[index]?.description && (
              <p className="text-sm text-destructive">
                {errors.chapters[index]?.description?.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`chapters.${index}.videoUrl`}>Video URL</Label>
            <Input
              id={`chapters.${index}.videoUrl`}
              type="text"
              placeholder="Enter video URL"
              {...register(`chapters.${index}.videoUrl` as const, {
                required: "Video URL is required",
                pattern: {
                  value: /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/,
                  message: "Invalid URL format",
                },
              })}
            />
            {errors.chapters?.[index]?.videoUrl && (
              <p className="text-sm text-destructive">
                {errors.chapters[index]?.videoUrl?.message}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Controller
                name={`chapters.${index}.isFree`}
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id={`chapters.${index}.isFree`}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor={`chapters.${index}.isFree`}>Free Chapter</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name={`chapters.${index}.isPublished`}
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id={`chapters.${index}.isPublished`}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor={`chapters.${index}.isPublished`}>
                Publish Chapter
              </Label>
            </div>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({
            title: "",
            description: "",
            videoUrl: "",
            isFree: false,
            isPublished: false,
          })
        }
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Chapter
      </Button>

      <Button type="submit" className="md:ml-2" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          submitButtonText
        )}
      </Button>
    </form>
  );
}

export default function AddChapters({ params }: { params: { slug: string } }) {
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (chapters: ChapterFormData[]) => {
    setIsSubmitting(true);
    let allChaptersCreated = true;

    try {
      for (const chapter of chapters) {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/chapter/create/${params.slug}`,
          {
            title: chapter.title,
            description: chapter.description,
            slug: params.slug,
            videoUrl: chapter.videoUrl,
            isFree: chapter.isFree,
            isPublished: chapter.isPublished,
          }
        );

        if (response.status !== 201) {
          allChaptersCreated = false;
          toast.error(`Failed to create chapter: ${chapter.title}`);
        }
      }

      if (allChaptersCreated) {
        setShowSuccessDialog(true);
        toast.success("All chapters created successfully");
      }
    } catch (error) {
      console.error("Error creating chapters:", error);
      toast.error("An unexpected error occurred while creating chapters");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">Add Chapters</CardTitle>
          <CardDescription>Create chapters for your course</CardDescription>
        </CardHeader>
        <CardContent>
          <ChapterForm
            onSubmit={handleSubmit}
            submitButtonText="Create Chapters"
            isSubmitting={isSubmitting}
          />
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <span className="text-sm text-gray-500">
            Note: You can add more chapters later from the course dashboard
          </span>
        </CardFooter>
      </Card>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chapters Created Successfully</AlertDialogTitle>
            <AlertDialogDescription>
              All chapters have been created successfully. Would you like to
              view the course?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => router.back()}>
              Go Back
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
