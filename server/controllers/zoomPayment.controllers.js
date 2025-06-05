import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { razorpay } from "../app.js";
import crypto from "crypto";

// User: Get my subscribed Zoom classes (ALL registrations, but secure zoom details)
export const getMyZoomSubscriptions = asyncHandler(async (req, res) => {
  try {
    // Get ALL user subscriptions regardless of payment/approval status
    const subscriptions = await prisma.zoomSubscription.findMany({
      where: {
        userId: req.user.id,
        isRegistered: true, // Only show actual registrations
      },
      include: {
        zoomLiveClass: {
          include: {
            createdBy: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });    // Transform data for better frontend display
    const transformedSubscriptions = subscriptions.map((sub) => {
      // Determine if user has full access to zoom details
      const userHasAccess = sub.hasAccessToLinks ||
        (!sub.zoomLiveClass.courseFeeEnabled && sub.isApproved);

      // Check if user can actually join (has access AND class is open)
      const canJoinClass = userHasAccess && sub.zoomLiveClass.isOnClassroom;

      const baseSession = {
        ...sub.zoomLiveClass,
        id: sub.zoomLiveClass.id,
        title: sub.zoomLiveClass.title,
        teacherName: sub.zoomLiveClass.createdBy?.name || "Instructor",
        isOnClassroom: sub.zoomLiveClass.isOnClassroom || false,
        canJoinClass: canJoinClass,
        // Handle date formatting properly - check if startTime is a valid date
        formattedDate: (() => {
          const date = new Date(sub.zoomLiveClass.startTime);
          if (isNaN(date.getTime())) {
            // If invalid date, use the string as is or show a default message
            return sub.zoomLiveClass.startTime || "Date to be announced";
          }
          return date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        })(),
        formattedTime: (() => {
          const date = new Date(sub.zoomLiveClass.startTime);
          if (isNaN(date.getTime())) {
            // If invalid date, return a default time message
            return "Time to be announced";
          }
          return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });
        })(),
        duration: Math.ceil(
          (new Date(sub.zoomLiveClass.endTime || new Date()) -
            new Date(sub.zoomLiveClass.startTime)) /
          (60 * 1000)
        ),
      };

      // Only include zoom meeting details if user can actually join the class
      if (canJoinClass) {
        baseSession.zoomMeetingId = sub.zoomLiveClass.zoomMeetingId;
        baseSession.zoomMeetingPassword = sub.zoomLiveClass.zoomMeetingPassword;
        baseSession.zoomJoinUrl = sub.zoomLiveClass.zoomJoinUrl;
        baseSession.zoomStartUrl = sub.zoomLiveClass.zoomStartUrl;
        baseSession.zoomLink = sub.zoomLiveClass.zoomLink;
        baseSession.zoomPassword = sub.zoomLiveClass.zoomPassword;
      }

      return {
        ...sub,
        zoomSession: baseSession,
        zoomLiveClass: undefined,
      };
    });

    return res
      .status(200)
      .json(
        new ApiResponsive(
          200,
          transformedSubscriptions,
          "Your subscriptions fetched successfully"
        )
      );
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    throw new ApiError(500, "Failed to fetch your subscriptions");
  }
});

// User: Register for Zoom Live Class (pay registration fee)
export const registerForZoomLiveClass = asyncHandler(async (req, res) => {
  const { zoomLiveClassId } = req.body;

  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id: zoomLiveClassId },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  if (!zoomLiveClass.isActive) {
    throw new ApiError(400, "This Zoom live class is not active");
  }

  // Check if registration is enabled for this class
  if (!zoomLiveClass.registrationEnabled) {
    throw new ApiError(400, "Registration is currently disabled for this class");
  }

  // Validate that the registration fee is set
  if (zoomLiveClass.registrationFee <= 0) {
    throw new ApiError(400, "Invalid registration fee");
  }

  // Check if user already has an active registration
  const existingRegistration = await prisma.zoomSubscription.findFirst({
    where: {
      userId: req.user.id,
      zoomLiveClassId,
      isRegistered: true,
    },
  });

  if (existingRegistration) {
    // Return success instead of error if already registered
    return res.status(200).json(
      new ApiResponsive(
        200,
        {
          alreadyRegistered: true,
          subscription: existingRegistration,
        },
        "You are already registered for this class"
      )
    );
  }

  // Check if user had a previous subscription but canceled it
  const cancelledSubscription = await prisma.zoomSubscription.findFirst({
    where: {
      userId: req.user.id,
      zoomLiveClassId,
      status: "CANCELLED",
    },
  });

  // Generate receipt ID
  const timestamp = Date.now().toString().slice(-8);
  const shortClassId = zoomLiveClassId.slice(0, 8);
  const shortUserId = req.user.id.slice(0, 8);
  const receipt = `zoom_reg_${shortClassId}_${shortUserId}_${timestamp}`;

  // Create Razorpay order for registration fee
  const options = {
    amount: Math.round(zoomLiveClass.registrationFee * 100),
    currency: "INR",
    receipt: receipt,
    notes: {
      userId: req.user.id,
      zoomLiveClassId,
      paymentType: "REGISTRATION",
      previousSubscriptionId: cancelledSubscription?.id || null,
    },
  };

  const order = await razorpay.orders.create(options);

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        order,
        zoomLiveClass,
        isRegistration: true,
        isReactivation: !!cancelledSubscription,
      },
      cancelledSubscription
        ? "Registration order created to reactivate your subscription"
        : "Registration order created successfully"
    )
  );
});

// User: Verify registration payment
export const verifyRegistrationPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    zoomLiveClassId,
  } = req.body;

  if (
    !razorpay_payment_id ||
    !razorpay_order_id ||
    !razorpay_signature ||
    !zoomLiveClassId
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Verify signature
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid payment signature");
  }

  // Get order details from Razorpay to check if this was a reactivation
  const order = await razorpay.orders.fetch(razorpay_order_id);
  const previousSubscriptionId = order.notes?.previousSubscriptionId || null;

  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id: zoomLiveClassId },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  // Calculate subscription end date (1 month from now)
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 1);

  // Next payment date (1 month from now)
  const nextPaymentDate = new Date();
  nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

  // Generate receipt number
  const receiptNumber = `ZM-REG-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;

  // Create subscription and payment records in transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      let subscription;

      // If we have a previous subscription ID, update that one
      if (previousSubscriptionId) {
        subscription = await tx.zoomSubscription.update({
          where: { id: previousSubscriptionId },
          data: {
            startDate,
            endDate,
            nextPaymentDate,
            status: "PENDING_APPROVAL", // Set to pending approval so admin can review
            isRegistered: true,
            hasAccessToLinks: false, // Reset access until course fee is paid
            registrationPaymentId: razorpay_payment_id,
          },
        });
      } else {
        // Check if user already has any subscription (active or not)
        const existingSubscription = await tx.zoomSubscription.findFirst({
          where: {
            userId: req.user.id,
            zoomLiveClassId,
          },
        }); if (existingSubscription) {
          // Update existing subscription
          subscription = await tx.zoomSubscription.update({
            where: { id: existingSubscription.id },
            data: {
              startDate,
              endDate,
              nextPaymentDate,
              status: "PENDING_APPROVAL", // Set to PENDING_APPROVAL for admin review
              isRegistered: true,
              isApproved: false, // Require admin approval after registration
              hasAccessToLinks: false, // No access until admin approval and course fee payment
              registrationPaymentId: razorpay_payment_id,
            },
          });
        } else {
          // Create new subscription
          subscription = await tx.zoomSubscription.create({
            data: {
              userId: req.user.id,
              zoomLiveClassId,
              startDate,
              endDate,
              nextPaymentDate,
              status: "PENDING_APPROVAL", // Set to PENDING_APPROVAL for admin review
              isRegistered: true,
              isApproved: false, // Require admin approval after registration
              hasAccessToLinks: false, // No access until admin approval and course fee payment
              registrationPaymentId: razorpay_payment_id,
            },
          });
        }
      }

      // Create payment record
      const payment = await tx.zoomPayment.create({
        data: {
          amount: zoomLiveClass.registrationFee,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          receiptNumber,
          status: "COMPLETED",
          paymentType: "REGISTRATION",
          userId: req.user.id,
          subscriptionId: subscription.id,
        },
      });

      return { subscription, payment };
    });

    return res
      .status(200)
      .json(new ApiResponsive(
        200,
        result,
        "Registration payment successful. You can now access live class content."
      )
      );
  } catch (error) {
    throw new ApiError(500, error.message || "Payment processing failed");
  }
});

// User: Pay course access fee
export const payCourseAccess = asyncHandler(async (req, res) => {
  const { zoomLiveClassId, zoomSessionId } = req.body;

  // If zoomSessionId is provided but zoomLiveClassId is not, use zoomSessionId
  const classId = zoomLiveClassId || zoomSessionId;

  if (!classId) {
    throw new ApiError(400, "Zoom live class ID is required");
  }

  // Check if user already has a subscription
  const existingSubscription = await prisma.zoomSubscription.findFirst({
    where: {
      userId: req.user.id,
      zoomLiveClassId: classId,
      isRegistered: true,
    },
  });

  if (!existingSubscription) {
    throw new ApiError(400, "You must register for this class first");
  }

  // Check if the user's registration has been approved by admin
  if (!existingSubscription.isApproved) {
    throw new ApiError(
      403,
      "Your registration is pending approval from the administrator. Please wait for approval before paying the course fee."
    );
  }

  // Check if user already has access to the class
  if (existingSubscription.hasAccessToLinks) {
    return res.status(200).json(
      new ApiResponsive(
        200,
        {
          alreadyHasAccess: true,
          subscription: existingSubscription,
        },
        "You already have access to this class"
      )
    );
  }

  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id: classId },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  // Validate that the course fee is set
  if (zoomLiveClass.courseFee <= 0) {
    throw new ApiError(400, "Invalid course fee");
  }

  const timestamp = Date.now().toString().slice(-8);
  const shortClassId = classId.slice(0, 8);
  const shortUserId = req.user.id.slice(0, 8);
  const receipt = `zoom_access_${shortClassId}_${shortUserId}_${timestamp}`;

  // Create Razorpay order
  const options = {
    amount: Math.round(zoomLiveClass.courseFee * 100),
    currency: "INR",
    receipt: receipt,
    notes: {
      userId: req.user.id,
      zoomLiveClassId: classId,
      paymentType: "COURSE_ACCESS",
      subscriptionId: existingSubscription.id,
    },
  };

  const order = await razorpay.orders.create(options);

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        order,
        zoomLiveClass,
        isCourseAccess: true,
      },
      "Course access order created successfully"
    )
  );
});

// User: Verify course access payment
export const verifyCourseAccessPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    zoomLiveClassId,
    zoomSessionId,
  } = req.body;



  // Use zoomLiveClassId if provided, otherwise use zoomSessionId
  const classId = zoomLiveClassId || zoomSessionId;

  if (
    !razorpay_payment_id ||
    !razorpay_order_id ||
    !razorpay_signature ||
    !classId
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Verify signature
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid payment signature");
  }

  // Check if user is registered first
  const existingSubscription = await prisma.zoomSubscription.findFirst({
    where: {
      userId: req.user.id,
      zoomLiveClassId: classId,
      isRegistered: true,
    },
  });

  if (!existingSubscription) {
    throw new ApiError(400, "You must register for this class first");
  }

  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id: classId },
    include: {
      modules: true,
    },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  // Generate receipt number
  const receiptNumber = `ZM-ACCESS-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;
  // Update subscription and create payment records in transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Update subscription to grant immediate access after course fee payment
      const updatedSubscription = await tx.zoomSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: "ACTIVE", // Keep status as ACTIVE after course fee payment
          hasAccessToLinks: true, // Grant immediate access to links
          isApproved: true, // Confirm approval status
        },
      });

      // Create payment record
      const payment = await tx.zoomPayment.create({
        data: {
          amount: zoomLiveClass.courseFee,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          receiptNumber,
          status: "COMPLETED",
          paymentType: "COURSE_ACCESS",
          userId: req.user.id,
          subscriptionId: updatedSubscription.id,
        },
      });

      return { subscription: updatedSubscription, payment };
    });
    return res
      .status(200)
      .json(
        new ApiResponsive(
          200,
          result,
          "Course fee payment successful. You now have access to class materials. Classroom will be enabled by admin."
        )
      );
  } catch (error) {
    console.error("Error completing course access payment:", error);
    throw new ApiError(
      500,
      error.message || "Payment processing failed. Please contact support."
    );
  }
});

// User: Cancel subscription
export const cancelZoomSubscription = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;

  const subscription = await prisma.zoomSubscription.findUnique({
    where: {
      id: subscriptionId,
      userId: req.user.id,
    },
    include: {
      zoomLiveClass: true,
    },
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }

  // Check if subscription can be cancelled (allow multiple statuses)
  const cancellableStatuses = ["ACTIVE", "PENDING_APPROVAL", "REGISTERED"];
  if (!cancellableStatuses.includes(subscription.status)) {
    throw new ApiError(
      400,
      "This subscription is already cancelled or expired"
    );
  }
  // Update the subscription status to cancelled
  const updatedSubscription = await prisma.zoomSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: "CANCELLED",
      isRegistered: false, // Reset registration status
      hasAccessToLinks: false, // Remove access to links
      isApproved: false, // Reset approval status - user will need re-approval for future registrations
    },
  });


  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        updatedSubscription,
        "Subscription cancelled successfully"
      )
    );
});

// Admin: Cancel subscription (by admin)
export const adminCancelZoomSubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const subscription = await prisma.zoomSubscription.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      zoomLiveClass: true,
    },
  });
  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }

  // Check if subscription can be cancelled (allow multiple statuses)
  const cancellableStatuses = ["ACTIVE", "PENDING_APPROVAL", "REGISTERED"];
  if (!cancellableStatuses.includes(subscription.status)) {
    throw new ApiError(
      400,
      "This subscription is already cancelled or expired"
    );
  }
  const updatedSubscription = await prisma.zoomSubscription.update({
    where: { id },
    data: {
      status: "CANCELLED",
      isRegistered: false, // Reset registration status
      hasAccessToLinks: false, // Remove access to links
      isApproved: false, // Reset approval status - user will need re-approval for future registrations
    },
  });


  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        updatedSubscription,
        "Subscription cancelled successfully"
      )
    );
});

// Check if user has access to a Zoom live class
export const checkZoomAccess = asyncHandler(async (req, res) => {
  const { zoomLiveClassId } = req.params;

  // Verify that the class exists
  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id: zoomLiveClassId },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  // Check if user has a subscription for this class
  const subscription = await prisma.zoomSubscription.findFirst({
    where: {
      userId: req.user.id,
      zoomLiveClassId,
    },
  });

  // Default response
  const response = {
    hasRegistered: false,
    hasPaidCourseFee: false,
    zoomDetails: null,
  };

  if (subscription) {
    response.hasRegistered = subscription.isRegistered;
    response.hasPaidCourseFee = subscription.hasAccessToLinks;

    // If user has paid course fee, include Zoom details
    if (subscription.hasAccessToLinks) {
      response.zoomDetails = {
        link: zoomLiveClass.zoomLink,
        meetingId: zoomLiveClass.zoomMeetingId,
        password: zoomLiveClass.zoomPassword,
      };
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(200, response, "Access status checked successfully")
    );
});

// Admin: Get all zoom payments
export const getAllZoomPayments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const payments = await prisma.zoomPayment.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      subscription: {
        include: {
          zoomLiveClass: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  const total = await prisma.zoomPayment.count();

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        payments,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
      "Zoom payments fetched successfully"
    )
  );
});

// Admin: Get zoom analytics
export const getZoomAnalytics = asyncHandler(async (req, res) => {
  // Get summary data for dashboard
  const totalClasses = await prisma.zoomLiveClass.count();
  const activeSubscriptions = await prisma.zoomSubscription.count({
    where: { status: "ACTIVE" },
  });

  // Get revenue data
  const payments = await prisma.zoomPayment.findMany({
    where: { status: "COMPLETED" },
    include: {
      subscription: {
        include: {
          zoomLiveClass: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  const totalRevenue = payments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  );

  // Monthly revenue analysis
  const monthlyRevenue = {};
  payments.forEach((payment) => {
    const month = new Date(payment.createdAt).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    monthlyRevenue[month] = (monthlyRevenue[month] || 0) + payment.amount;
  });

  // Recent payments
  const recentPayments = await prisma.zoomPayment.findMany({
    where: { status: "COMPLETED" },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      subscription: {
        include: {
          zoomLiveClass: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });

  // Transform recentPayments to match the frontend expected structure
  const transformedRecentPayments = recentPayments.map((payment) => ({
    ...payment,
    subscription: {
      ...payment.subscription,
      zoomSession: {
        title: payment.subscription?.zoomLiveClass?.title || "Unknown Session",
      },
    },
  }));

  // Class popularity
  const classSubscriptions = await prisma.zoomLiveClass.findMany({
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
      },
    },
  });

  const classPopularity = classSubscriptions
    .map((liveClass) => ({
      id: liveClass.id,
      title: liveClass.title,
      subscriberCount: liveClass.subscriptions.length,
      isActive: liveClass.isActive,
    }))
    .sort((a, b) => b.subscriberCount - a.subscriberCount);

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        totalClasses,
        activeSubscriptions,
        totalRevenue,
        monthlyRevenue,
        recentPayments: transformedRecentPayments,
        sessionPopularity: classPopularity,
      },
      "Zoom analytics fetched successfully"
    )
  );
});

// Check if user has a subscription for a Zoom live class
export const checkSubscription = asyncHandler(async (req, res) => {
  const { zoomLiveClassId } = req.params;
  const { moduleId } = req.query;

  // Check if ID is undefined or invalid
  if (!zoomLiveClassId) {
    throw new ApiError(400, "Invalid or missing class ID/slug");
  }

  // Try to find by ID first
  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id: zoomLiveClassId },
  });

  // If not found by ID, try to find by slug
  if (!zoomLiveClass) {
    const zoomLiveClassBySlug = await prisma.zoomLiveClass.findUnique({
      where: { slug: zoomLiveClassId },
    });

    if (!zoomLiveClassBySlug) {
      console.log(
        "Class not found by slug either. Invalid ID/slug:",
        zoomLiveClassId
      );
      throw new ApiError(404, "Zoom live class not found");
    }

    // Use the class found by slug
    const subscription = await prisma.zoomSubscription.findFirst({
      where: {
        userId: req.user.id,
        zoomLiveClassId: zoomLiveClassBySlug.id,
        ...(moduleId ? { moduleId } : {}),
      },
    });    // Default response structure
    const responseData = {
      isSubscribed: false,
      isRegistered: false,
      isApproved: false,
      hasAccessToLinks: false,
      isOnClassroom: zoomLiveClassBySlug.isOnClassroom || false,
      canJoinClass: false,
      canRegister: zoomLiveClassBySlug.registrationEnabled || false,
      showDemo: false,
      showCourseFee: false,
      showWaiting: false,
      showClosed: false,
      meetingDetails: null,
      courseFeeEnabled: zoomLiveClassBySlug.courseFeeEnabled,
      registrationEnabled: zoomLiveClassBySlug.registrationEnabled,
      isOnline: zoomLiveClassBySlug.isOnClassroom || false,  // ADD: isOnline status
    };

    if (subscription && subscription.isRegistered) {
      // User has registered
      responseData.isRegistered = true;
      responseData.isSubscribed = subscription.status === "ACTIVE";
      responseData.isApproved = subscription.isApproved || false;

      // Show demo access for ANY registered user (payment done, regardless of approval status)
      // Only hide demo if status is REJECTED
      if (subscription.status !== "REJECTED") {
        responseData.showDemo = true;
      }

      if (subscription.isApproved) {
        // User is approved
        if (!zoomLiveClassBySlug.courseFeeEnabled) {
          // No course fee required - direct access after approval
          responseData.hasAccessToLinks = true;
          responseData.canJoinClass = responseData.isOnClassroom;
        } else {
          // Course fee enabled
          if (subscription.hasAccessToLinks) {
            // User has paid course fee
            responseData.hasAccessToLinks = true;
            responseData.canJoinClass = responseData.isOnClassroom;
            responseData.showWaiting = !responseData.isOnClassroom;
          } else {
            // User needs to pay course fee
            responseData.showCourseFee = true;
          }
        }
      } else if (subscription.status === "REJECTED") {
        // User was rejected - reset to new user state
        responseData.isRegistered = false;
        responseData.showDemo = false;
        responseData.showClosed = !zoomLiveClassBySlug.registrationEnabled;
        responseData.canRegister = zoomLiveClassBySlug.registrationEnabled;
      }
      // If PENDING_APPROVAL, user can see demo but nothing else
    } else {
      // User hasn't registered or registration was rejected/cancelled
      if (zoomLiveClassBySlug.registrationEnabled) {
        responseData.canRegister = true;
      } else {
        responseData.showClosed = true;
      }
    }

    // Only provide meeting details if user can actually join
    if (responseData.canJoinClass) {
      responseData.meetingDetails = {
        link: zoomLiveClassBySlug.zoomLink,
        meetingId: zoomLiveClassBySlug.zoomMeetingId,
        password: zoomLiveClassBySlug.zoomPassword,
      };
    }

    return res
      .status(200)
      .json(
        new ApiResponsive(
          200,
          responseData,
          "Subscription status checked successfully"
        )
      );
  }

  // Continue with the original logic for ID-based lookup
  const subscription = await prisma.zoomSubscription.findFirst({
    where: {
      userId: req.user.id,
      zoomLiveClassId,
      ...(moduleId ? { moduleId } : {}),
    },
  });
  // Default response structure
  const responseData = {
    isSubscribed: false,
    isRegistered: false,
    isApproved: false,
    hasAccessToLinks: false,
    isOnClassroom: zoomLiveClass.isOnClassroom || false,
    canJoinClass: false,
    canRegister: zoomLiveClass.registrationEnabled || false,
    showDemo: false,
    showCourseFee: false,
    showWaiting: false,
    showClosed: false,
    meetingDetails: null,
    courseFeeEnabled: zoomLiveClass.courseFeeEnabled,
    registrationEnabled: zoomLiveClass.registrationEnabled,
    isOnline: zoomLiveClass.isOnClassroom || false,  // ADD: isOnline status
  };
  if (subscription && subscription.isRegistered) {
    // User has registered
    responseData.isRegistered = true;
    responseData.isSubscribed = subscription.status === "ACTIVE";
    responseData.isApproved = subscription.isApproved || false;

    // Show demo access for ANY registered user (payment done, regardless of approval status)
    // Only hide demo if status is REJECTED
    if (subscription.status !== "REJECTED") {
      responseData.showDemo = true;
    }

    if (subscription.isApproved) {
      // User is approved
      if (!zoomLiveClass.courseFeeEnabled) {
        // No course fee required - direct access after approval
        responseData.hasAccessToLinks = true;
        responseData.canJoinClass = responseData.isOnClassroom;
      } else {
        // Course fee enabled
        if (subscription.hasAccessToLinks) {
          // User has paid course fee
          responseData.hasAccessToLinks = true;
          responseData.canJoinClass = responseData.isOnClassroom;
          responseData.showWaiting = !responseData.isOnClassroom;
        } else {
          // User needs to pay course fee
          responseData.showCourseFee = true;
        }
      }
    } else if (subscription.status === "REJECTED") {
      // User was rejected - reset to new user state
      responseData.isRegistered = false;
      responseData.showDemo = false;
      responseData.showClosed = !zoomLiveClass.registrationEnabled;
      responseData.canRegister = zoomLiveClass.registrationEnabled;
    }
    // If PENDING_APPROVAL, user can see demo but nothing else
  } else {
    // User hasn't registered or registration was rejected/cancelled
    if (zoomLiveClass.registrationEnabled) {
      responseData.canRegister = true;
    } else {
      responseData.showClosed = true;
    }
  }  // Only provide meeting details if user can actually join
  if (responseData.canJoinClass) {
    responseData.meetingDetails = {
      link: zoomLiveClass.zoomLink,
      meetingId: zoomLiveClass.zoomMeetingId,
      password: zoomLiveClass.zoomPassword,
    };
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        responseData,
        "Subscription status checked successfully"
      )
    );
});

// Admin: Get all subscriptions
export const getAllZoomSubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await prisma.zoomSubscription.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      zoomLiveClass: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform the data to match the expected frontend structure
  const transformedSubscriptions = subscriptions.map((subscription) => ({
    ...subscription,
    zoomSession: {
      id: subscription.zoomLiveClass?.id,
      title: subscription.zoomLiveClass?.title || "Unknown Session",
    },
    zoomLiveClass: undefined,
  }));

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        transformedSubscriptions,
        "All zoom subscriptions fetched successfully"
      )
    );
});

// Admin: Get registrations for a specific class
export const getClassRegistrations = asyncHandler(async (req, res) => {
  const { id: classId } = req.params;

  // Verify that the class exists
  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id: classId },
    select: {
      id: true,
      title: true,
      registrationEnabled: true,
      courseFeeEnabled: true,
    },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  // Get all subscriptions/registrations for this specific class
  const registrations = await prisma.zoomSubscription.findMany({
    where: {
      zoomLiveClassId: classId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      payments: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1, // Get the latest payment
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform the data to match the expected frontend structure
  const transformedRegistrations = registrations.map((registration) => ({
    ...registration,
    zoomSession: {
      id: zoomLiveClass.id,
      title: zoomLiveClass.title,
    },
    latestPayment: registration.payments[0] || null,
    payments: undefined, // Remove the payments array to avoid duplication
  }));

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        {
          registrations: transformedRegistrations,
          classInfo: zoomLiveClass,
          totalRegistrations: registrations.length,
        },
        `Registrations for class "${zoomLiveClass.title}" fetched successfully`
      )
    );
});

// Admin: Get pending approvals
export const getPendingApprovals = asyncHandler(async (req, res) => {
  // Get all subscriptions waiting for approval
  const pendingSubscriptions = await prisma.zoomSubscription.findMany({
    where: {
      status: "PENDING_APPROVAL",
      isRegistered: true, // Only get subscriptions where registration is paid
      registrationPaymentId: {
        not: null,
      }, // Only include subscriptions that have a payment ID
      zoomLiveClass: {
        courseFeeEnabled: true, // Only get subscriptions for classes where course fee is enabled
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      zoomLiveClass: {
        select: {
          id: true,
          title: true,
          currentRaga: true,
          currentOrientation: true,
          registrationFee: true,
          courseFee: true,
          startTime: true,
          courseFeeEnabled: true,
        },
      },
      payments: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  // Transform data to match expected front-end structure
  const transformedSubscriptions = pendingSubscriptions.map((sub) => ({
    ...sub,
    zoomSession: {
      id: sub.zoomLiveClass?.id,
      title: sub.zoomLiveClass?.title || "Unknown Session",
      currentRange: sub.zoomLiveClass?.currentRaga,
      currentOrientation: sub.zoomLiveClass?.currentOrientation,
      registrationFee: sub.zoomLiveClass?.registrationFee,
      courseFee: sub.zoomLiveClass?.courseFee,
      startTime: sub.zoomLiveClass?.startTime,
      courseFeeEnabled: sub.zoomLiveClass?.courseFeeEnabled,
    },
    zoomLiveClass: undefined,
  }));

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        transformedSubscriptions,
        "Pending approval subscriptions fetched successfully"
      )
    );
});

// Admin: Approve subscription
export const approveZoomSubscription = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;

  // Find the subscription
  const subscription = await prisma.zoomSubscription.findUnique({
    where: { id: subscriptionId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      zoomLiveClass: true,
    },
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }

  if (subscription.status !== "PENDING_APPROVAL") {
    throw new ApiError(
      400,
      "This subscription is not in pending approval state"
    );
  }
  // Update the subscription status
  const updatedSubscription = await prisma.zoomSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: "ACTIVE",
      isApproved: true,
      hasAccessToLinks: true, // Grant access to links upon course fee approval
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      zoomLiveClass: true,
    },
  });



  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        updatedSubscription,
        "Subscription approved successfully"
      )
    );
});

// Admin: Reject subscription
export const rejectZoomSubscription = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;

  // Find the subscription
  const subscription = await prisma.zoomSubscription.findUnique({
    where: { id: subscriptionId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      zoomLiveClass: true,
    },
  });

  if (!subscription) {
    throw new ApiError(404, "Subscription not found");
  }

  if (subscription.status !== "PENDING_APPROVAL") {
    throw new ApiError(
      400,
      "This subscription is not in pending approval state"
    );
  }

  // Update the subscription status - Reset user completely as if they never registered
  const updatedSubscription = await prisma.zoomSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: "REJECTED",
      isApproved: false,
      isRegistered: false, // Reset registration status so they need to register again
      hasAccessToLinks: false, // Remove any access
      registrationPaymentId: null, // Clear payment reference
    },
  });

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        updatedSubscription,
        "Subscription rejected successfully. User will need to register again."
      )
    );
});

// Admin: Bulk approve registrations for a specific class
export const bulkApproveClassRegistrations = asyncHandler(async (req, res) => {
  const { id: classId } = req.params;
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new ApiError(400, "User IDs array is required and cannot be empty");
  }

  // Verify that the class exists and get courseFeeEnabled status
  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id: classId },
    select: {
      id: true,
      title: true,
      courseFeeEnabled: true,
    },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  // Find all subscriptions for the specified users and class
  const subscriptions = await prisma.zoomSubscription.findMany({
    where: {
      zoomLiveClassId: classId,
      userId: { in: userIds },
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
  });

  if (subscriptions.length === 0) {
    throw new ApiError(404, "No subscriptions found for the specified users and class");
  }

  const results = {
    approved: 0,
    alreadyApproved: 0,
    failed: 0,
    details: [],
  };

  // Process each subscription
  for (const subscription of subscriptions) {
    try {
      if (subscription.isRegistered && subscription.status === "ACTIVE" && subscription.isApproved) {
        results.alreadyApproved++;
        results.details.push({
          userId: subscription.userId,
          userName: subscription.user.name,
          status: "already_approved",
          message: "Already approved",
        });
        continue;
      }

      // Update subscription status based on courseFeeEnabled
      const updateData = {
        isRegistered: true,
        status: "ACTIVE",
        isApproved: true,
      };

      // If course fee is not enabled, grant immediate access
      if (!zoomLiveClass.courseFeeEnabled) {
        updateData.hasAccessToLinks = true;
      }
      // If course fee is enabled, user needs to pay course fee separately

      await prisma.zoomSubscription.update({
        where: { id: subscription.id },
        data: updateData,
      });

      results.approved++;
      results.details.push({
        userId: subscription.userId,
        userName: subscription.user.name,
        status: "approved",
        message: zoomLiveClass.courseFeeEnabled
          ? "Approved - Course fee payment required for access"
          : "Approved - Access granted immediately",
      });

    } catch (error) {
      console.error(`Error approving subscription for user ${subscription.userId}:`, error);
      results.failed++;
      results.details.push({
        userId: subscription.userId,
        userName: subscription.user.name,
        status: "failed",
        message: error.message,
      });
    }
  }

  const message = `Bulk approval completed: ${results.approved} approved, ${results.alreadyApproved} already approved, ${results.failed} failed`;

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        results,
        message
      )
    );
});

// Admin: Remove user access from a specific class
export const removeUserAccess = asyncHandler(async (req, res) => {
  const { id: classId } = req.params;
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new ApiError(400, "User IDs array is required and cannot be empty");
  }

  // Verify that the class exists
  const zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id: classId },
    select: {
      id: true,
      title: true,
    },
  });

  if (!zoomLiveClass) {
    throw new ApiError(404, "Zoom live class not found");
  }

  // Find all subscriptions for the specified users and class
  const subscriptions = await prisma.zoomSubscription.findMany({
    where: {
      zoomLiveClassId: classId,
      userId: { in: userIds },
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
  });

  if (subscriptions.length === 0) {
    throw new ApiError(404, "No subscriptions found for the specified users and class");
  }

  const results = {
    removed: 0,
    alreadyRemoved: 0,
    failed: 0,
    details: [],
  };

  // Process each subscription
  for (const subscription of subscriptions) {
    try {
      // Check if user already doesn't have access
      if (!subscription.hasAccessToLinks && !subscription.isApproved) {
        results.alreadyRemoved++;
        results.details.push({
          userId: subscription.userId,
          userName: subscription.user.name,
          status: "already_removed",
          message: "Access already removed",
        });
        continue;
      }

      // Remove access and reset approval status
      await prisma.zoomSubscription.update({
        where: { id: subscription.id },
        data: {
          isApproved: false, // Remove approval
          hasAccessToLinks: false, // Remove access to zoom links
          status: "PENDING_APPROVAL", // Set back to pending approval
        },
      });

      results.removed++;
      results.details.push({
        userId: subscription.userId,
        userName: subscription.user.name,
        status: "removed",
        message: "Access successfully removed",
      });

    } catch (error) {
      console.error(`Error removing access for user ${subscription.userId}:`, error);
      results.failed++;
      results.details.push({
        userId: subscription.userId,
        userName: subscription.user.name,
        status: "failed",
        message: error.message,
      });
    }
  }

  const message = `Access removal completed: ${results.removed} removed, ${results.alreadyRemoved} already removed, ${results.failed} failed`;

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        results,
        message
      )
    );
});

// User: Get demo access for registered users (after registration payment)
export const getDemoAccess = asyncHandler(async (req, res) => {
  const { zoomLiveClassId } = req.params;

  // Check if ID is undefined or invalid
  if (!zoomLiveClassId) {
    throw new ApiError(400, "Invalid or missing class ID/slug");
  }

  // Try to find by ID first
  let zoomLiveClass = await prisma.zoomLiveClass.findUnique({
    where: { id: zoomLiveClassId },
    select: {
      id: true,
      title: true,
      zoomLink: true,
      zoomPassword: true,
      zoomMeetingId: true,
      registrationEnabled: true,
    },
  });

  // If not found by ID, try to find by slug
  if (!zoomLiveClass) {
    zoomLiveClass = await prisma.zoomLiveClass.findUnique({
      where: { slug: zoomLiveClassId },
      select: {
        id: true,
        title: true,
        zoomLink: true,
        zoomPassword: true,
        zoomMeetingId: true,
        registrationEnabled: true,
      },
    });
  }

  if (!zoomLiveClass) {
    console.log("Class not found by ID or slug:", zoomLiveClassId);
    throw new ApiError(404, "Zoom live class not found");
  }
  // Check if user has registered for this class (paid registration fee)
  const subscription = await prisma.zoomSubscription.findFirst({
    where: {
      userId: req.user.id,
      zoomLiveClassId: zoomLiveClass.id, // Use the found class ID
      isRegistered: true, // Must have paid registration fee
    },
  });

  if (!subscription) {
    throw new ApiError(403, "You must register and pay the registration fee to access demo");
  }

  // If subscription was rejected, deny demo access
  if (subscription.status === "REJECTED") {
    throw new ApiError(403, "Your registration was rejected. Please register again.");
  }

  // Use main zoom links as demo links for now
  const demoDetails = {
    classTitle: zoomLiveClass.title,
    demoLink: zoomLiveClass.zoomLink || null,
    demoPassword: zoomLiveClass.zoomPassword || null,
    demoMeetingId: zoomLiveClass.zoomMeetingId || null,
    isDemoConfigured: true, // Using main zoom links as demo
    approvalStatus: subscription.isApproved ? "APPROVED" : "PENDING",
    registrationStatus: subscription.status,
    message: subscription.isApproved
      ? "Your registration has been approved! You can now proceed with course fee payment if required."
      : subscription.status === "PENDING_APPROVAL"
        ? "Your registration payment is received! You can access demo class while waiting for admin approval."
        : "Your registration is being processed. You have demo access.",
  };

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        demoDetails,
        "Demo access granted successfully"
      )
    );
});
