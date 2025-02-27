import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createSlug } from "../helper/Slug.js";

// Helper functions
const validateRequiredFields = (fields, errorMessage) => {
  if (Object.values(fields).some((field) => !field?.trim())) {
    throw new ApiError(400, errorMessage);
  }
};

const findChapter = async (slug) => {
  const chapter = await prisma.chapter.findUnique({
    where: { slug },
  });

  if (!chapter) {
    throw new Error("Chapter not found");
  }

  return chapter;
};

// Controllers
export const createChapter = asyncHandler(async (req, res) => {
  const { title, description, videoUrl, isFree, isPublished } = req.body;
  const { sectionSlug } = req.params;

  if (!title || !description || !sectionSlug || !videoUrl) {
    throw new ApiError(400, "All fields are required");
  }

  // Find section instead of course
  const section = await prisma.section.findUnique({
    where: { slug: sectionSlug },
  });

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  // Get last position in this section
  const lastChapter = await prisma.chapter.findFirst({
    where: { sectionId: section.id },
    orderBy: { position: "desc" },
  });

  let baseSlug = createSlug(title);
  let uniqueSlug = baseSlug;
  let counter = 1;
  while (await prisma.chapter.findUnique({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  const chapter = await prisma.chapter.create({
    data: {
      title: title,
      description: description,
      slug: uniqueSlug,
      sectionId: section.id,
      videoUrl,
      position: lastChapter ? lastChapter.position + 1 : 1,
      isFree: Boolean(isFree),
      isPublished: Boolean(isPublished),
    },
  });

  return res
    .status(201)
    .json(new ApiResponsive(201, "Chapter created successfully", chapter));
});

export const getChapters = asyncHandler(async (req, res) => {
  const { sectionSlug } = req.params;

  if (!sectionSlug) {
    throw new ApiError(400, "Please provide section slug");
  }

  const section = await prisma.section.findUnique({
    where: { slug: sectionSlug },
    include: {
      chapters: {
        orderBy: { position: "asc" },
        videoUrl: false,
      },
    },
  });

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        "Chapters retrieved successfully",
        section.chapters
      )
    );
});

export const getChapter = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    throw new ApiError(400, "Please provide slug");
  }

  const chapter = await findChapter(slug);

  return res
    .status(200)
    .json(new ApiResponsive(200, "Chapter retrieved successfully", chapter));
});

export const updateChapter = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { title, description, videoUrl } = req.body;

  if (!slug) {
    throw new ApiError(400, "Please provide slug");
  }

  const updateData = {};
  if (title) updateData.title = title;
  if (description) updateData.description = description;
  if (videoUrl) updateData.videoUrl = videoUrl;

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "Please provide fields to update");
  }

  await findChapter(slug);

  const updatedChapter = await prisma.chapter.update({
    where: { slug },
    data: updateData,
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(200, "Chapter updated successfully", updatedChapter)
    );
});

export const chapterPublishToggle = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    throw new ApiError(400, "Please provide slug");
  }

  const chapter = await findChapter(slug);

  const updatedChapter = await prisma.chapter.update({
    where: { slug },
    data: { isPublished: !chapter.isPublished },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        "Chapter publish status updated successfully",
        updatedChapter
      )
    );
});

export const chapterFreeToggle = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    throw new ApiError(400, "Please provide slug");
  }

  const chapter = await findChapter(slug);

  const updatedChapter = await prisma.chapter.update({
    where: { slug },
    data: { isFree: !chapter.isFree },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        "Chapter free status updated successfully",
        updatedChapter
      )
    );
});

export const chapterProgress = asyncHandler(async (req, res) => {
  const { userId, slug, isCompleted } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  await findChapter(slug);

  const userProgress = await prisma.userProgress.upsert({
    where: {
      userId_slug: {
        userId,
        slug,
      },
    },
    update: {
      isCompleted: isCompleted !== undefined ? isCompleted : false,
    },
    create: {
      userId,
      slug,
      isCompleted: isCompleted || false,
    },
  });

  return res
    .status(200)
    .json(new ApiResponsive(200, "Progress updated", userProgress));
});

export const getDraftChapters = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    const [chapters, totalchapters] = await Promise.all([
      prisma.chapter.findMany({
        where: { isPublished: false },
        skip,
        take: limit,
      }),
      prisma.chapter.count({ where: { isPublished: false } }),
    ]);

    return res.status(200).json(
      new ApiResponsive(200, "chapters retrieved successfully", {
        chapters,
        totalPages: Math.ceil(totalchapters / limit),
        currentPage: page,
      })
    );
  } catch (error) {
    console.error("Error retrieving draft chapters:", error);
    return res
      .status(500)
      .json(new ApiError(500, "Failed to retrieve draft chapters"));
  }
});

export const getChapterVideoUrl = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    throw new ApiError(400, "Please provide slug");
  }

  const chapter = await findChapter(slug);

  if (!chapter.videoUrl) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponsive(200, "Chapter video retrieved", chapter.videoUrl));
});

export const deleteChapter = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    throw new ApiError(400, "Please provide slug");
  }

  // Find chapter with correct relationship name
  const chapter = await prisma.chapter.findUnique({
    where: { slug },
    include: { section: true }, // Changed from Section to section
  });

  if (!chapter) {
    throw new ApiError(404, "Chapter not found");
  }

  // Start transaction for delete and reorder
  await prisma.$transaction(async (tx) => {
    // Delete the chapter
    await tx.chapter.delete({
      where: { slug },
    });

    // Get and update remaining chapters
    const remainingChapters = await tx.chapter.findMany({
      where: {
        sectionId: chapter.sectionId,
        position: { gt: chapter.position },
      },
      orderBy: { position: "asc" },
    });

    // Update positions
    for (const ch of remainingChapters) {
      await tx.chapter.update({
        where: { id: ch.id },
        data: { position: ch.position - 1 },
      });
    }
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        "Chapter deleted and positions reordered successfully"
      )
    );
});

export const reorderChapters = asyncHandler(async (req, res) => {
  const { sectionSlug } = req.params;
  const { chapters } = req.body;

  if (!Array.isArray(chapters)) {
    throw new ApiError(400, "Invalid chapters array");
  }

  const section = await prisma.section.findUnique({
    where: { slug: sectionSlug },
  });

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  // Update all positions in a transaction with ordered array
  await prisma.$transaction(
    chapters.map((chapter, index) =>
      prisma.chapter.update({
        where: {
          id: chapter.id,
          sectionId: section.id,
        },
        data: { position: index + 1 },
      })
    )
  );

  // Fetch updated chapters
  const updatedChapters = await prisma.chapter.findMany({
    where: { sectionId: section.id },
    orderBy: { position: "asc" },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(200, "Chapters reordered successfully", updatedChapters)
    );
});

export const getAllChapterBySectionSlug = asyncHandler(async (req, res) => {
  const { sectionSlug } = req.params;

  if (!sectionSlug) {
    throw new ApiError(400, "Please provide section slug");
  }

  const section = await prisma.section.findUnique({
    where: { slug: sectionSlug },
    include: {
      chapters: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!section) {
    throw new ApiError(404, "Section not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        "Chapters retrieved successfully",
        section.chapters
      )
    );
});
