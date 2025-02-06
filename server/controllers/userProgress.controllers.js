import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const markChapterComplete = asyncHandler(async (req, res) => {
  const { chapterId, watchedTime } = req.body;
  const userId = req.user.id;

  // Verify chapter exists
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      section: {
        include: {
          course: true
        }
      }
    }
  });

  if (!chapter) throw new ApiError(404, "Chapter not found");

  // Update or create progress
  const userProgress = await prisma.userProgress.upsert({
    where: {
      userId_chapterId: { userId, chapterId }
    },
    update: {
      isCompleted: true,
      watchedTime: watchedTime || 0,
      lastAccessed: new Date()
    },
    create: {
      userId,
      chapterId,
      isCompleted: true,
      watchedTime: watchedTime || 0
    }
  });

  // Calculate course completion percentage
  const courseProgress = await calculateCourseProgress(userId, chapter.section.courseId);

  return res.status(200).json(
    new ApiResponsive(200, {
      message: "Chapter marked as complete",
      progress: userProgress,
      courseProgress
    })
  );
});

export const updateProgress = asyncHandler(async (req, res) => {
  const { chapterId, watchedTime } = req.body;
  const userId = req.user.id;

  const progress = await prisma.userProgress.upsert({
    where: {
      userId_chapterId: { userId, chapterId }
    },
    update: {
      watchedTime: parseFloat(watchedTime),
      lastAccessed: new Date()
    },
    create: {
      userId,
      chapterId,
      watchedTime: parseFloat(watchedTime),
      isCompleted: false
    }
  });

  return res.status(200).json(
    new ApiResponsive(200, progress, "Progress updated successfully")
  );
});

export const getCourseProgress = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.id;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      chapters: {
        include: {
          userProgress: {
            where: { userId }
          }
        }
      }
    }
  });

  if (!course) throw new ApiError(404, "Course not found");

  const totalChapters = course.chapters.length;
  const completedChapters = course.chapters.filter(
    chapter => chapter.userProgress[0]?.isCompleted
  ).length;

  const progress = {
    courseId,
    totalChapters,
    completedChapters,
    percentage: Math.round((completedChapters / totalChapters) * 100),
    lastAccessed: course.chapters
      .map(ch => ch.userProgress[0]?.lastAccessed)
      .filter(Boolean)
      .sort((a, b) => b - a)[0],
    chapterProgress: course.chapters.map(chapter => ({
      chapterId: chapter.id,
      title: chapter.title,
      isCompleted: chapter.userProgress[0]?.isCompleted || false,
      watchedTime: chapter.userProgress[0]?.watchedTime || 0,
      lastAccessed: chapter.userProgress[0]?.lastAccessed
    }))
  };

  return res.status(200).json(
    new ApiResponsive(200, progress, "Course progress retrieved")
  );
});

// Helper function
const calculateCourseProgress = async (userId, courseId) => {
  const progress = await prisma.chapter.count({
    where: {
      courseId,
      userProgress: {
        some: {
          userId,
          isCompleted: true
        }
      }
    }
  });

  const total = await prisma.chapter.count({
    where: { courseId }
  });

  return {
    completed: progress,
    total,
    percentage: Math.round((progress / total) * 100)
  };
};
export const getProgress = asyncHandler(async (req, res) => {
  const { chapterId } = req.params;
  const userId = req.user.id;

  // Get chapter with progress
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: {
      section: {
        include: {
          course: true
        }
      },
      userProgress: {
        where: { userId }
      }
    }
  });

  if (!chapter) {
    throw new ApiError(404, "Chapter not found");
  }

  // Get progress or create default
  const progress = chapter.userProgress[0] || {
    isCompleted: false,
    watchedTime: 0,
    notes: null,
    bookmarked: false,
    lastAccessed: null
  };

  // Get next chapter if exists
  const nextChapter = await prisma.chapter.findFirst({
    where: {
      sectionId: chapter.sectionId,
      position: {
        gt: chapter.position
      }
    },
    orderBy: {
      position: 'asc'
    }
  });

  return res.status(200).json(
    new ApiResponsive(200, {
      chapterId,
      title: chapter.title,
      courseId: chapter.section.courseId,
      progress: {
        isCompleted: progress.isCompleted,
        watchedTime: progress.watchedTime,
        notes: progress.notes,
        bookmarked: progress.bookmarked,
        lastAccessed: progress.lastAccessed
      },
      nextChapterId: nextChapter?.id || null,
      courseProgress: await calculateCourseProgress(userId, chapter.section.courseId)
    }, "Progress retrieved successfully")
  );
});