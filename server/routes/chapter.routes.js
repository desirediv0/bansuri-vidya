import { Router } from "express";
import {
  createChapter,
  getChapters,
  getChapter,
  updateChapter,
  deleteChapter,
  chapterPublishToggle,
  chapterFreeToggle,
  chapterProgress,
  getDraftChapters,
  getChapterVideoUrl,
  reorderChapters,
  getAllChapterBySectionSlug,
} from "../controllers/chapter.controllers.js";

import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

router.route("/url/:slug").post(getChapterVideoUrl);

router.route("/").get(verifyJWTToken, getChapters);

router
  .route("/:slug")
  .get(verifyJWTToken, getChapter)
  .put(verifyJWTToken, verifyAdmin, updateChapter)
  .delete(verifyJWTToken, verifyAdmin, deleteChapter);

router
  .route("/:slug/publish")
  .patch(verifyJWTToken, verifyAdmin, chapterPublishToggle);

router
  .route("/:slug/free")
  .patch(verifyJWTToken, verifyAdmin, chapterFreeToggle);

router.route("/progress").post(verifyJWTToken, chapterProgress);
router
  .route("/draft-chapter")
  .get(verifyJWTToken, verifyAdmin, getDraftChapters);

router
  .route("/create/:sectionSlug")
  .post(verifyJWTToken, verifyAdmin, createChapter);
router.route("/get/:sectionSlug").get(verifyJWTToken, getChapters);
router
  .route("/reorder/:sectionSlug")
  .put(verifyJWTToken, verifyAdmin, reorderChapters);

router
  .route("/get-all-chapter-by-section-slug/:sectionSlug")
  .get(verifyJWTToken, getAllChapterBySectionSlug);

export default router;
