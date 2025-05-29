import { Router } from "express";
import {
  createZoomReview,
  getZoomClassReviews,
  updateZoomReview,
  deleteZoomReview,
  getAllZoomReviews,
} from "../controllers/zoom-review.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

// Public route to get reviews for a specific zoom class
router.get("/class/:zoomClassId", getZoomClassReviews);

// Protected routes - require authentication
router.use(verifyJWTToken);
router.post("/create", createZoomReview);
router.put("/update/:id", updateZoomReview);
router.delete("/delete/:id", deleteZoomReview);

// Admin routes
router.get("/admin/all", verifyJWTToken, verifyAdmin, getAllZoomReviews);

export default router;
