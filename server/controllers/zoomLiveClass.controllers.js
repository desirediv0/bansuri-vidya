import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import axios from "axios";
import { deleteFromS3 } from "../utils/deleteFromS3.js";
import { createSlug } from "../helper/Slug.js";

// Function to get Zoom access token
const getZoomAccessToken = async () => {
  try {
    const accountId = process.env.ZOOM_ACCOUNT_ID;
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    const authBuffer = Buffer.from(`${clientId}:${clientSecret}`).toString(
      "base64"
    );

    const response = await axios.post(
      "https://zoom.us/oauth/token",
      new URLSearchParams({
        grant_type: "account_credentials",
        account_id: accountId,
      }),
      {
        headers: {
          Authorization: `Basic ${authBuffer}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error("Error getting Zoom access token:", error);
    throw new ApiError(500, "Failed to get Zoom access token");
  }
};

// Create Zoom meeting
const createZoomMeeting = async (meetingData) => {
  try {
    const token = await getZoomAccessToken();

    // Just use the startTime as provided, without converting it - this allows for any string time format
    const startTime = meetingData.startTime;

    const response = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        topic: meetingData.title,
        type: 2, // Scheduled meeting
        start_time: startTime,
        duration: 0, // 0 means no fixed duration - meeting can run until manually ended
        timezone: "Asia/Kolkata",
        settings: {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: true,
          waiting_room: true,
          auto_recording: "none", // Disable auto recording
          allow_multiple_devices: true, // Allow joining from multiple devices
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    ); return {
      zoomMeetingId: String(response.data.id),
      zoomLink: response.data.join_url,
      zoomStartUrl: response.data.start_url,
      zoomPassword: response.data.password,
    };
  } catch (error) {
    console.error("Error creating Zoom meeting:", error);
    throw new ApiError(500, "Failed to create Zoom meeting");
  }
};

// Delete Zoom meeting
const deleteZoomMeeting = async (meetingId) => {
  try {
    const token = await getZoomAccessToken();

    await axios.delete(
      `https://api.zoom.us/v2/meetings/${meetingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`Zoom meeting ${meetingId} deleted successfully`);
    return true;
  } catch (error) {
    console.error("Error deleting Zoom meeting:", error);
    // Don't throw error for deletion failures to avoid breaking the flow
    // Log the error and continue
    return false;
  }
};

// Admin: Create a new Zoom live class
export const createZoomLiveClass = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    startTime,
    endTime,
    price,
    getPrice,
    registrationFee,
    courseFee,
    courseFeeEnabled,
    registrationEnabled,
    capacity,
    recurringClass,
    thumbnailUrl,
    hasModules,
    isFirstModuleFree,
    modules,
    currentRaga,
    currentOrientation,
    sessionDescription,
    isActive,
    author,
    slug,
  } = req.body;

  if (!title || !startTime || !thumbnailUrl) {
    throw new ApiError(400, "Please provide all required fields");
  }

  try {
    // Format and validate slug
    let formattedSlug;
    if (slug) {
      // Ensure proper slug formatting even for user-provided slugs
      formattedSlug = createSlug(slug);
    } else {
      // Generate slug from title if not provided
      formattedSlug = createSlug(title);
    }

    // Check if slug already exists
    const existingClass = await prisma.zoomLiveClass.findUnique({
      where: { slug: formattedSlug },
    });

    if (existingClass) {
      // If slug exists, append a random string to make it unique
      const randomStr = Math.random().toString(36).substring(2, 7);
      formattedSlug = `${formattedSlug}-${randomStr}`;
    }    // Initialize base data with required fields - DO NOT create Zoom meeting yet
    const zoomLiveClassData = {
      title,
      description,
      startTime,
      endTime,
      price: parseFloat(price || 0),
      getPrice: getPrice || false,
      userId: req.user.id,
      // Zoom links will be null initially - created only when Live Status is turned ON
      zoomLink: null,
      zoomMeetingId: null,
      zoomPassword: null,
      thumbnailUrl,
      slug: formattedSlug,
      author: author || "",
      registrationFee: parseFloat(registrationFee || 0),
      courseFee: parseFloat(courseFee || 0),
      courseFeeEnabled: courseFeeEnabled || false,
      registrationEnabled: registrationEnabled !== undefined ? registrationEnabled : true,
      hasModules: hasModules || false,
      isFirstModuleFree: isFirstModuleFree || false,
      currentRaga: currentRaga || null,
      currentOrientation: currentOrientation || null,
      sessionDescription: sessionDescription || null,
      isActive: isActive !== undefined ? isActive : true,
      recurringClass: recurringClass || false,
      isOnClassroom: false, // Initially class is not live
    };

    // Add capacity if provided
    if (capacity !== undefined && capacity !== null) {
      zoomLiveClassData.capacity = parseInt(capacity);
    }

    // Use a transaction to create the Zoom session and modules
    const zoomLiveClass = await prisma.$transaction(async (tx) => {
      // Create the main zoom live class
      const liveClass = await tx.zoomLiveClass.create({
        data: zoomLiveClassData,
      });      // If modules are provided, create them (but without Zoom links initially)
      if (
        hasModules &&
        modules &&
        Array.isArray(modules) &&
        modules.length > 0
      ) {
        // Create each module without Zoom meeting initially
        for (let i = 0; i < modules.length; i++) {
          const module = modules[i];

          await tx.zoomSessionModule.create({
            data: {
              title: module.title,
              description: module.description,
              startTime: module.startTime,
              endTime: module.endTime,
              // Zoom links will be null initially - created when Live Status is ON
              zoomLink: null,
              zoomMeetingId: null,
              zoomPassword: null,
              position: i + 1,
              isFree: isFirstModuleFree && i === 0, // First module is free if isFirstModuleFree is true
              zoomLiveClassId: liveClass.id,
            },
          });
        }
      }

      return liveClass;
    });

    return res
      .status(201)
      .json(
        new ApiResponsive(
          201,
          zoomLiveClass,
          "Zoom live class created successfully"
        )
      );
  } catch (error) {
    // If the session creation fails but thumbnail was uploaded, delete the uploaded image
    if (thumbnailUrl) {
      try {
        await deleteFromS3(thumbnailUrl);
      } catch (err) {
        console.error(
          "Error deleting thumbnail after live class creation failed:",
          err
        );
      }
    }
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Failed to create Zoom live class"
    );
  }
});

// Admin: Get all Zoom live classes
export const getAllZoomLiveClasses = asyncHandler(async (req, res) => {
  // For admin users, return all zoom live class data including sensitive fields
  const zoomLiveClasses = await prisma.zoomLiveClass.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      subscriptions: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
      modules: true,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        zoomLiveClasses,
        "Zoom live classes fetched successfully"
      )
    );
});

// Admin: Update Zoom live class
export const updateZoomLiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    startTime,
    price,
    getPrice,
    registrationFee,
    courseFee,
    courseFeeEnabled,
    registrationEnabled,
    capacity,
    recurringClass,
    thumbnailUrl,
    hasModules,
    isFirstModuleFree,
    currentRaga,
    currentOrientation,
    sessionDescription,
    isActive,
    author,
    slug,
  } = req.body;

  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id },
  });

  if (!zoomLiveClass) {
    // If a new thumbnail was uploaded but class doesn't exist, delete it from S3
    if (thumbnailUrl) {
      try {
        await deleteFromS3(thumbnailUrl);
      } catch (err) {
        console.error("Error deleting thumbnail after update failed:", err);
      }
    }
    throw new ApiError(404, "Zoom live class not found");
  }

  const updatedFields = {};
  if (title !== undefined) updatedFields.title = title;
  if (description !== undefined) updatedFields.description = description;
  if (startTime !== undefined) updatedFields.startTime = startTime;
  if (price !== undefined) updatedFields.price = parseFloat(price);
  if (getPrice !== undefined) updatedFields.getPrice = getPrice;
  if (registrationFee !== undefined)
    updatedFields.registrationFee = parseFloat(registrationFee); if (courseFee !== undefined) updatedFields.courseFee = parseFloat(courseFee);
  if (courseFeeEnabled !== undefined)
    updatedFields.courseFeeEnabled = courseFeeEnabled;
  if (registrationEnabled !== undefined)
    updatedFields.registrationEnabled = registrationEnabled;
  if (capacity !== undefined && capacity !== null)
    updatedFields.capacity = parseInt(capacity);
  if (recurringClass !== undefined)
    updatedFields.recurringClass = recurringClass;
  if (hasModules !== undefined) updatedFields.hasModules = hasModules;
  if (isFirstModuleFree !== undefined)
    updatedFields.isFirstModuleFree = isFirstModuleFree;
  if (currentRaga !== undefined) updatedFields.currentRaga = currentRaga;
  if (currentOrientation !== undefined)
    updatedFields.currentOrientation = currentOrientation;
  if (sessionDescription !== undefined)
    updatedFields.sessionDescription = sessionDescription;
  if (isActive !== undefined) updatedFields.isActive = isActive;
  if (author !== undefined) updatedFields.author = author;

  // Handle slug update
  if (slug !== undefined) {
    // Always format the slug properly
    const formattedSlug = createSlug(slug);

    // Check if this slug already exists for a different class
    if (formattedSlug !== zoomLiveClass.slug) {
      const existingClass = await prisma.zoomLiveClass.findFirst({
        where: {
          slug: formattedSlug,
          id: { not: id },
        },
      });

      if (existingClass) {
        throw new ApiError(400, "This slug is already in use by another class");
      }
    }

    updatedFields.slug = formattedSlug;

  }

  // Handle thumbnail update
  if (thumbnailUrl !== undefined) {
    // If the thumbnail URL has changed and old one exists, delete the old one from S3
    const oldThumbnailUrl = zoomLiveClass.thumbnailUrl;
    const thumbnailHasChanged =
      oldThumbnailUrl && oldThumbnailUrl !== thumbnailUrl;

    if (thumbnailHasChanged) {
      try {

        await deleteFromS3(oldThumbnailUrl);
      } catch (err) {
        console.error("Error deleting old thumbnail:", err);
        // Continue with the update even if thumbnail deletion fails
      }
    }
    updatedFields.thumbnailUrl = thumbnailUrl;
  }

  try {
    const updatedClass = await prisma.zoomLiveClass.update({
      where: { id },
      data: updatedFields,
    });

    return res
      .status(200)
      .json(
        new ApiResponsive(
          200,
          updatedClass,
          "Zoom live class updated successfully"
        )
      );
  } catch (error) {
    console.error("Error updating zoom live class:", error);
    // If update fails and we uploaded a new thumbnail, delete it
    const oldThumbnailUrl = zoomLiveClass.thumbnailUrl;
    if (thumbnailUrl && thumbnailUrl !== oldThumbnailUrl) {
      try {
        await deleteFromS3(thumbnailUrl);
      } catch (err) {
        console.error("Error deleting thumbnail after update failed:", err);
      }
    }
    throw new ApiError(500, "Failed to update Zoom live class");
  }
});

// Admin: Delete Zoom live class
export const deleteZoomLiveClass = asyncHandler(async (req, res) => {
  const { id } = req.params;


  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id },
    include: {
      subscriptions: true,
      modules: true,
    },
  });

  if (!zoomLiveClass) {
    console.log(`Zoom live class with ID ${id} not found`);
    throw new ApiError(404, "Zoom live class not found");
  }


  // Delete the Zoom live class and related records in a transaction
  try {
    await prisma.$transaction(async (tx) => {
      // 1. First, find all subscriptions for this class
      const subscriptions = await tx.zoomSubscription.findMany({
        where: { zoomLiveClassId: id },
        select: { id: true },
      });

      // 2. Get all subscription IDs
      const subscriptionIds = subscriptions.map((sub) => sub.id);

      // 3. Delete all related payments first
      if (subscriptionIds.length > 0) {
        await tx.zoomPayment.deleteMany({
          where: {
            subscriptionId: {
              in: subscriptionIds,
            },
          },
        });
      }

      await tx.zoomSessionModule.deleteMany({
        where: { zoomLiveClassId: id },
      });

      await tx.zoomSubscription.deleteMany({
        where: { zoomLiveClassId: id },
      });


      // 6. Finally, delete the class itself
      await tx.zoomLiveClass.delete({
        where: { id },
      });
      console.log(`Deleted zoom live class with ID: ${id}`);
    });

    // Delete the thumbnail if it exists (after the database transaction completes)
    if (zoomLiveClass.thumbnailUrl) {
      try {

        await deleteFromS3(zoomLiveClass.thumbnailUrl);
        console.log(`Successfully deleted thumbnail from S3`);
      } catch (s3Error) {
        console.error(`Failed to delete thumbnail from S3: ${s3Error.message}`);
        // Continue with the response even if S3 deletion fails
      }
    }

    return res
      .status(200)
      .json(
        new ApiResponsive(200, null, "Zoom live class deleted successfully")
      );
  } catch (error) {
    console.error("Error deleting zoom live class:", error);
    throw new ApiError(
      500,
      "Failed to delete Zoom live class: " + error.message
    );
  }
});

// User: Get available Zoom live classes
export const getUserZoomLiveClasses = asyncHandler(async (req, res) => {
  const includeAll = req.query.includeAll === "true";

  const whereClause = includeAll ? {} : { isActive: true };

  const zoomLiveClasses = await prisma.zoomLiveClass.findMany({
    where: whereClause,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      subscriptions: {
        ...(req.user
          ? {
            where: {
              userId: req.user.id,
            },
          }
          : {}),
      },
      createdBy: {
        select: {
          name: true,
        },
      },
      modules: true,
    },
  });
  // Process each class to add formatted data and remove sensitive information
  const processedClasses = zoomLiveClasses.map((liveClass) => {
    // Check if user has access to links
    let isRegistered = false;
    let hasAccessToLinks = false;

    if (req.user && liveClass.subscriptions?.length > 0) {
      const subscription = liveClass.subscriptions[0];
      isRegistered = subscription.isRegistered || false;
      hasAccessToLinks = subscription.hasAccessToLinks || false;
    }

    // Check if user can actually join (has access AND admin enabled classroom)
    const canJoinClass = hasAccessToLinks && liveClass.isOnClassroom;

    // Create a copy of the class data
    const classData = { ...liveClass };

    // Remove sensitive zoom details unless user can actually join
    if (!req.user || !canJoinClass) {
      delete classData.zoomLink;
      delete classData.zoomMeetingId;
      delete classData.zoomPassword;

      // Also remove sensitive info from modules
      if (classData.modules) {
        classData.modules = classData.modules.map((module) => {
          const moduleCopy = { ...module };
          delete moduleCopy.zoomLink;
          delete moduleCopy.zoomMeetingId;
          delete moduleCopy.zoomPassword;
          return moduleCopy;
        });
      }
    }

    // Make sure teacherName is available even if author is empty
    const teacherName =
      classData.author || liveClass.createdBy?.name || "Instructor";    // Return transformed class
    return {
      ...classData,
      isRegistered,
      hasAccessToLinks,
      isOnClassroom: liveClass.isOnClassroom || false,
      canJoinClass,
      author: classData.author || "",
      teacherName,
      formattedDate: liveClass.startTime || "",
      formattedTime: liveClass.startTime || "",
      registrationEnabled: liveClass.registrationEnabled, // Include registration status
      subscriptions: undefined,
      createdBy: undefined,
    };
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        processedClasses,
        "Zoom live classes fetched successfully"
      )
    );
});

// Get a single Zoom live class by ID or slug
export const getZoomLiveClass = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;

  // Try to find by ID first, then by slug
  const zoomLiveClass = await prisma.zoomLiveClass.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      subscriptions: {
        ...(req.user
          ? {
            where: {
              userId: req.user.id,
            },
          }
          : {}),
      },
      createdBy: {
        select: {
          name: true,
        },
      },
      modules: {
        orderBy: {
          position: "asc",
        },
      },
    },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }
  // Check if user has access to links
  let isRegistered = false;
  let hasAccessToLinks = false;

  if (req.user && zoomLiveClass.subscriptions?.length > 0) {
    const subscription = zoomLiveClass.subscriptions[0];
    isRegistered = subscription.isRegistered || false;
    hasAccessToLinks = subscription.hasAccessToLinks || false;
  }

  // Check if user can actually join (has access AND admin enabled classroom)
  const canJoinClass = hasAccessToLinks && zoomLiveClass.isOnClassroom;

  // Create a copy of the class data
  const classData = { ...zoomLiveClass };

  // Remove sensitive zoom details unless user can actually join
  if (!req.user || !canJoinClass) {
    delete classData.zoomLink;
    delete classData.zoomMeetingId;
    delete classData.zoomPassword;

    // Also remove sensitive info from modules
    if (classData.modules) {
      classData.modules = classData.modules.map((module) => {
        const moduleCopy = { ...module };
        delete moduleCopy.zoomLink;
        delete moduleCopy.zoomMeetingId;
        delete moduleCopy.zoomPassword;
        return moduleCopy;
      });
    }
  }

  // Make sure teacherName is available even if author is empty
  const teacherName =
    classData.author || zoomLiveClass.createdBy?.name || "Instructor";
  // Return transformed class with additional formatted data
  const transformedClass = {
    ...classData,
    isRegistered,
    hasAccessToLinks,
    isOnClassroom: zoomLiveClass.isOnClassroom || false,
    canJoinClass,
    author: classData.author || "",
    teacherName,
    formattedDate: zoomLiveClass.startTime || "",
    formattedTime: zoomLiveClass.startTime || "",
    registrationEnabled: zoomLiveClass.registrationEnabled, // Include registration status
    subscriptions: undefined,
    createdBy: undefined,
  };

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        transformedClass,
        "Zoom live class fetched successfully"
      )
    );
});

// Admin: Toggle course fee enabled status
export const toggleCourseFeeEnabled = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { courseFeeEnabled } = req.body;

  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  const updatedClass = await prisma.zoomLiveClass.update({
    where: { id },
    data: {
      courseFeeEnabled: courseFeeEnabled,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        updatedClass,
        `Course fee requirement ${courseFeeEnabled ? "enabled" : "disabled"
        } successfully`
      )
    );
});

// Admin: Toggle registration enabled status
export const toggleRegistrationEnabled = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { registrationEnabled } = req.body;

  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  const updatedClass = await prisma.zoomLiveClass.update({
    where: { id },
    data: {
      registrationEnabled: registrationEnabled,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        updatedClass,
        `Registration ${registrationEnabled ? "enabled" : "disabled"
        } successfully`
      )
    );
});

// Admin: Toggle is on classroom status
export const toggleIsOnClassroom = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isOnClassroom } = req.body;

  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { position: "asc" }
      }
    }
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  // Use transaction to ensure all operations succeed or fail together
  const updatedClass = await prisma.$transaction(async (tx) => {
    if (isOnClassroom) {
      // TURNING ON: Create Zoom meetings for main class and all modules
      let mainClassZoomData = null;

      // Create Zoom meeting for main class
      try {
        mainClassZoomData = await createZoomMeeting({
          title: zoomLiveClass.title,
          startTime: zoomLiveClass.startTime,
        });
      } catch (error) {
        console.error("Error creating main class Zoom meeting:", error);
        throw new ApiError(500, "Failed to create Zoom meeting for main class");
      }      // Update main class with Zoom details
      const updatedMainClass = await tx.zoomLiveClass.update({
        where: { id },
        data: {
          isOnClassroom: true,
          zoomLink: mainClassZoomData.zoomLink,
          zoomStartUrl: mainClassZoomData.zoomStartUrl,
          zoomMeetingId: mainClassZoomData.zoomMeetingId,
          zoomPassword: mainClassZoomData.zoomPassword,
        },
      });

      // Create Zoom meetings for modules if they exist
      if (zoomLiveClass.modules && zoomLiveClass.modules.length > 0) {
        for (const module of zoomLiveClass.modules) {
          try {
            const moduleZoomData = await createZoomMeeting({
              title: `${zoomLiveClass.title} - ${module.title}`,
              startTime: module.startTime,
            }); await tx.zoomSessionModule.update({
              where: { id: module.id },
              data: {
                zoomLink: moduleZoomData.zoomLink,
                zoomStartUrl: moduleZoomData.zoomStartUrl,
                zoomMeetingId: moduleZoomData.zoomMeetingId,
                zoomPassword: moduleZoomData.zoomPassword,
              },
            });
          } catch (error) {
            console.error(`Error creating Zoom meeting for module ${module.title}:`, error);
            // Continue with other modules even if one fails
          }
        }
      }

      return updatedMainClass;
    } else {
      // TURNING OFF: Delete Zoom meetings and clear data

      // Delete main class Zoom meeting if it exists
      if (zoomLiveClass.zoomMeetingId) {
        await deleteZoomMeeting(zoomLiveClass.zoomMeetingId);
      }

      // Delete module Zoom meetings if they exist
      if (zoomLiveClass.modules && zoomLiveClass.modules.length > 0) {
        for (const module of zoomLiveClass.modules) {
          if (module.zoomMeetingId) {
            await deleteZoomMeeting(module.zoomMeetingId);
          }          // Clear module Zoom data
          await tx.zoomSessionModule.update({
            where: { id: module.id },
            data: {
              zoomLink: null,
              zoomStartUrl: null,
              zoomMeetingId: null,
              zoomPassword: null,
            },
          });
        }
      }

      // Update main class and clear Zoom data
      const updatedMainClass = await tx.zoomLiveClass.update({
        where: { id },
        data: {
          isOnClassroom: false,
          zoomLink: null,
          zoomStartUrl: null,
          zoomMeetingId: null,
          zoomPassword: null,
        },
      });

      return updatedMainClass;
    }
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        updatedClass,
        `Live class ${isOnClassroom ? "started" : "stopped"} successfully`
      )
    );
});

// Admin: Get join link for class
export const getAdminJoinLink = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  // Check if class is active
  if (!zoomLiveClass.isActive) {
    throw new ApiError(400, "Class is not active");
  }
  // Return zoom details for admin - use start URL if available, otherwise join URL
  const zoomDetails = {
    zoomLink: zoomLiveClass.zoomStartUrl || zoomLiveClass.zoomLink || zoomLiveClass.zoomJoinUrl,
    zoomMeetingId: zoomLiveClass.zoomMeetingId,
    zoomPassword: zoomLiveClass.zoomPassword || zoomLiveClass.zoomMeetingPassword,
    zoomStartUrl: zoomLiveClass.zoomStartUrl, // Admin can use start URL if available
  };

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        zoomDetails,
        "Admin zoom details retrieved successfully"
      )
    );
});


export const getAllLiveClassesSEO = asyncHandler(async (req, res) => {
  const zoomLiveClasses = await prisma.zoomLiveClass.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      title: true,
      description: true,
      thumbnailUrl: true,
      startTime: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        zoomLiveClasses,
        "All active live classes fetched successfully"
      )
    );
});

