"use client";

import type React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Play, Lock, ChevronRight, CheckCircle } from "lucide-react";
import type { CourseDataNew, ChapterDataNew } from "@/type";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChapterListProps {
  course: CourseDataNew;
  selectedChapter: ChapterDataNew | null;
  isPurchased: boolean;
  onChapterClick: (chapter: ChapterDataNew) => void;
  canAccessContent: boolean;
  completedChapters: string[];
  courseProgress: number;
}

const ChapterList: React.FC<ChapterListProps> = ({
  course,
  selectedChapter,
  onChapterClick,
  canAccessContent,
  completedChapters = [],
  courseProgress = 0,
}) => {
  const isChapterCompleted = (chapterId: string) => {
    return (
      Array.isArray(completedChapters) && completedChapters.includes(chapterId)
    );
  };

  const isChapterAccessible = (chapter: ChapterDataNew) => {
    return canAccessContent || chapter.isFree;
  };

  const activeSection = course.sections?.find((section) =>
    section.chapters.some((chapter) => chapter.id === selectedChapter?.id)
  )?.id;

  return (
    <div className="h-full bg-white font-plus-jakarta-sans">
      <div className="p-6 border-b bg-red-600 text-white relative md:mt-14">
        <h2 className="text-2xl font-bold">Course Content</h2>
        <div className="mt-2">
          <Progress value={courseProgress} className="w-full bg-red-400" />
          <p className="text-sm mt-1">{Math.round(courseProgress)}% Complete</p>
        </div>
      </div>
      <ScrollArea className="h-[calc(100vh-10rem)]">
        <Accordion
          type="single"
          defaultValue={activeSection}
          collapsible
          className="w-full"
        >
          {course.sections &&
            course.sections
              .filter(
                (section) => section.chapters && section.chapters.length > 0
              )
              .map((section, index) => (
                <AccordionItem
                  value={section.id}
                  key={section.id}
                  className="border-b"
                >
                  <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 text-left">
                    <div className="flex items-center gap-3">
                      <span className="text-red-600 font-semibold">
                        Section {index + 1}:
                      </span>
                      <span className="font-medium text-gray-800">
                        {section.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-0">
                    <div className="space-y-1 p-2">
                      {section.chapters.map((chapter) => {
                        const accessible = isChapterAccessible(chapter);
                        const completed = isChapterCompleted(chapter.id);
                        const selected = selectedChapter?.id === chapter.id;

                        const button = (
                          <Button
                            key={chapter.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start p-3 h-auto font-inter transition-all duration-300 rounded-md",
                              selected &&
                                "bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-700",
                              completed && !selected && "bg-green-50/50",
                              !selected && "hover:bg-gray-100",
                              !accessible &&
                                "opacity-50 bg-gray-100 cursor-not-allowed",
                              "group"
                            )}
                            onClick={() => onChapterClick(chapter)}
                            disabled={!accessible}
                            aria-disabled={!accessible}
                          >
                            <div className="flex items-center w-full">
                              <div className="flex-shrink-0 mr-3">
                                {accessible ? (
                                  completed ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <Play className="h-5 w-5 text-gray-600" />
                                  )
                                ) : (
                                  <Lock className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-grow">
                                <span className="text-left font-medium block text-gray-800">
                                  {chapter.title}
                                </span>

                                {completed && (
                                  <span className="text-xs text-green-600">
                                    Completed
                                  </span>
                                )}
                              </div>
                              <ChevronRight className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                          </Button>
                        );

                        if (!accessible) {
                          return (
                            <TooltipProvider
                              key={chapter.id}
                              delayDuration={100}
                            >
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="w-full">{button}</div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    Purchase the course to access this chapter
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        }

                        return button;
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
        </Accordion>
      </ScrollArea>
    </div>
  );
};

export default ChapterList;
