import { Router } from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import {
  createZoomLiveClass,
  getAllZoomLiveClasses,
  updateZoomLiveClass,
  deleteZoomLiveClass,
  getUserZoomLiveClasses,
  getZoomLiveClass,
  toggleCourseFeeEnabled,
  toggleRegistrationEnabled,
  toggleIsOnClassroom,
  getAdminJoinLink,
  getAllLiveClassesSEO,
} from "../controllers/zoomLiveClass.controllers.js";

import {
  registerForZoomLiveClass,
  verifyRegistrationPayment,
  payCourseAccess,
  verifyCourseAccessPayment,
  cancelZoomSubscription,
  adminCancelZoomSubscription,
  checkZoomAccess,
  getAllZoomPayments,
  getZoomAnalytics,
  getMyZoomSubscriptions,
  checkSubscription,
  getAllZoomSubscriptions,
  getClassRegistrations,
  getPendingApprovals,
  approveZoomSubscription,
  rejectZoomSubscription,
  bulkApproveClassRegistrations,
  removeUserAccess,
  getDemoAccess,
} from "../controllers/zoomPayment.controllers.js";

const router = Router();

// Public routes
router.get("/classes", getUserZoomLiveClasses);
router.get("/class/:idOrSlug", getZoomLiveClass);
router.get("/seo-classes", getAllLiveClassesSEO)
// Add compatibility route for the older "session" naming convention
router.get("/session/:idOrSlug", getZoomLiveClass);

// User routes (protected)
router.get("/my-subscriptions", verifyJWTToken, getMyZoomSubscriptions);
router.post("/register", verifyJWTToken, registerForZoomLiveClass);
router.post("/verify-registration", verifyJWTToken, verifyRegistrationPayment);
router.post("/pay-course-access", verifyJWTToken, payCourseAccess);
router.post("/verify-course-access", verifyJWTToken, verifyCourseAccessPayment);
router.post(
  "/cancel-subscription/:subscriptionId",
  verifyJWTToken,
  cancelZoomSubscription
);
router.get("/check-access/:zoomLiveClassId", verifyJWTToken, checkZoomAccess);
router.get(
  "/check-subscription/:zoomLiveClassId",
  verifyJWTToken,
  checkSubscription
);
router.get(
  "/demo-access/:zoomLiveClassId",
  verifyJWTToken,
  getDemoAccess
);

// Admin routes
router.post("/admin/class", verifyJWTToken, verifyAdmin, createZoomLiveClass);
router.get(
  "/admin/classes",
  verifyJWTToken,
  verifyAdmin,
  getAllZoomLiveClasses
);
router.put(
  "/admin/class/:id",
  verifyJWTToken,
  verifyAdmin,
  updateZoomLiveClass
);
router.delete(
  "/admin/class/:id",
  verifyJWTToken,
  verifyAdmin,
  deleteZoomLiveClass
);
// Add compatibility routes for the older "session" naming convention
router.put(
  "/admin/session/:id",
  verifyJWTToken,
  verifyAdmin,
  updateZoomLiveClass
);
router.delete(
  "/admin/session/:id",
  verifyJWTToken,
  verifyAdmin,
  deleteZoomLiveClass
);
router.post(
  "/admin/cancel-subscription/:id",
  verifyJWTToken,
  verifyAdmin,
  adminCancelZoomSubscription
);
router.get("/admin/payments", verifyJWTToken, verifyAdmin, getAllZoomPayments);
router.get("/admin/analytics", verifyJWTToken, verifyAdmin, getZoomAnalytics);
router.get(
  "/admin/subscriptions",
  verifyJWTToken,
  verifyAdmin,
  getAllZoomSubscriptions
);
router.get(
  "/admin/class/:id/registrations",
  verifyJWTToken,
  verifyAdmin,
  getClassRegistrations
);
router.post(
  "/admin/class/:id/approve-registrations",
  verifyJWTToken,
  verifyAdmin,
  bulkApproveClassRegistrations
);
router.post(
  "/admin/class/:id/remove-access",
  verifyJWTToken,
  verifyAdmin,
  removeUserAccess
);
router.get(
  "/admin/pending-approvals",
  verifyJWTToken,
  verifyAdmin,
  getPendingApprovals
);
router.post(
  "/admin/approve-subscription/:subscriptionId",
  verifyJWTToken,
  verifyAdmin,
  approveZoomSubscription
);
router.post(
  "/admin/reject-subscription/:subscriptionId",
  verifyJWTToken,
  verifyAdmin,
  rejectZoomSubscription
);

// Add new admin routes after other admin routes
router.post(
  "/admin/class/:id/toggle-course-fee",
  verifyJWTToken,
  verifyAdmin,
  toggleCourseFeeEnabled
);

router.post(
  "/admin/class/:id/toggle-registration",
  verifyJWTToken,
  verifyAdmin,
  toggleRegistrationEnabled
);

router.post(
  "/admin/class/:id/toggle-classroom",
  verifyJWTToken,
  verifyAdmin,
  toggleIsOnClassroom
);

router.get(
  "/admin/class/:id/join",
  verifyJWTToken,
  verifyAdmin,
  getAdminJoinLink
);

// Admin join class route
router.post(
  "/admin/join-class/:classId",
  verifyJWTToken,
  verifyAdmin,
  async (req, res) => {
    const { classId } = req.params;
    // Logic for admin to join the class
    // This might involve adding the admin to the class participants in the database
    // For now, let's just send a success response
    res.status(200).json({ message: `Admin joined the class ${classId}` });
  }
);

export default router;
