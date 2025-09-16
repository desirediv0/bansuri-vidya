import { Router } from "express";
import {
  createPurchase,
  checkPurchase,
  getMyPurchases,
  AdminGetAllPurchases,
  getCoursePurchaseHistory,
  getPurchaseStatistics,
  AdminGetPurchasesByUser,
} from "../controllers/purchase.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router.post("/", verifyJWTToken, createPurchase);
router.get("/all", verifyJWTToken, verifyAdmin, AdminGetAllPurchases);
router.get("/my-course", verifyJWTToken, getMyPurchases);
router.get("/:courseId", verifyJWTToken, checkPurchase);
router.get("/course/:courseId/history", verifyAdmin, getCoursePurchaseHistory);
router.get("/statistics", verifyAdmin, getPurchaseStatistics);
// Admin: get purchases for a specific user by slug or id
router.get("/user/:slug", verifyJWTToken, verifyAdmin, AdminGetPurchasesByUser);
router.get("/user/id/:userId", verifyJWTToken, verifyAdmin, AdminGetPurchasesByUser);

export default router;
