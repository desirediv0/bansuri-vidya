import { Router } from "express";
import {
  enrollCourse,
  checkEnrollment,
  getUserEnrollments,
  AdminGetEnrollmentsByUser,
} from "../controllers/enrollment.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router.get("/check/:id", verifyJWTToken, checkEnrollment);

router.get("/user", verifyJWTToken, getUserEnrollments);

router.post("/enroll", verifyJWTToken, enrollCourse);

// Admin: get enrollments for a specific user
router.get("/user/:slug", verifyJWTToken, verifyAdmin, AdminGetEnrollmentsByUser);
router.get("/user/id/:userId", verifyJWTToken, verifyAdmin, AdminGetEnrollmentsByUser);

export default router;
