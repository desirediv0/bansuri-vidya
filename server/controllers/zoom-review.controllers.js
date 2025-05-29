import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";

// Create Review for Zoom Class
export const createZoomReview = asyncHandler(async (req, res) => {
  const { zoomClassId, rating, comment } = req.body;
  const userId = req.user.id;

  // Check if zoom class exists
  const zoomClass = await prisma.zoomLiveClass.findUnique({
    where: { id: zoomClassId },
  });

  if (!zoomClass) {
    throw new ApiError(404, "Live class not found");
  }

  // Check if user is enrolled/subscribed
  const subscription = await prisma.zoomSubscription.findFirst({
    where: {
      userId,
      zoomLiveClassId: zoomClassId,
      isRegistered: true,
    },
  });

  if (!subscription) {
    throw new ApiError(
      403,
      "You must be registered in the live class to review it"
    );
  }

  // Check if user already reviewed
  const existingReview = await prisma.zoomClassReview.findFirst({
    where: {
      userId,
      zoomClassId,
    },
  });

  if (existingReview) {
    throw new ApiError(400, "You have already reviewed this live class");
  }

  const review = await prisma.zoomClassReview.create({
    data: {
      rating,
      comment,
      userId,
      zoomClassId,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return res
    .status(201)
    .json(new ApiResponsive(201, review, "Review created successfully"));
});

// Get Zoom Class Reviews
export const getZoomClassReviews = asyncHandler(async (req, res) => {
  const { zoomClassId } = req.params;

  const reviews = await prisma.zoomClassReview.findMany({
    where: {
      zoomClassId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res
    .status(200)
    .json(new ApiResponsive(200, reviews, "Reviews fetched successfully"));
});

// Get All Zoom Reviews (Admin)
export const getAllZoomReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search;

  const where = {
    ...(search && {
      OR: [
        { comment: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { zoomClass: { title: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  const [reviews, total] = await Promise.all([
    prisma.zoomClassReview.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        zoomClass: {
          select: {
            title: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.zoomClassReview.count({ where }),
  ]);

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        reviews,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
        },
      },
      "Reviews fetched successfully"
    )
  );
});

// Update Zoom Review
export const updateZoomReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  const review = await prisma.zoomClassReview.findUnique({
    where: { id },
  });

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Check ownership
  if (review.userId !== userId && !req.user.role === "ADMIN") {
    throw new ApiError(403, "Not authorized to update this review");
  }

  const updatedReview = await prisma.zoomClassReview.update({
    where: { id },
    data: {
      rating,
      comment,
      isEdited: true,
      updatedAt: new Date(),
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      zoomClass: {
        select: {
          title: true,
          slug: true,
        },
      },
    },
  });

  return res
    .status(200)
    .json(new ApiResponsive(200, updatedReview, "Review updated successfully"));
});

// Delete Zoom Review
export const deleteZoomReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const review = await prisma.zoomClassReview.findUnique({
    where: { id },
  });

  if (!review) {
    throw new ApiError(404, "Review not found");
  }

  // Check ownership or admin
  if (review.userId !== userId && !req.user.isAdmin) {
    throw new ApiError(403, "Not authorized to delete this review");
  }

  await prisma.zoomClassReview.delete({
    where: { id },
  });

  return res
    .status(200)
    .json(new ApiResponsive(200, null, "Review deleted successfully"));
});
