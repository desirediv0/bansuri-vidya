import { Router } from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import {
  coursePage,
  createCourse,
  deleteCourse,
  DraftCourse,
  getCourse,
  getCourseall,
  getCourses,
  getNewCourses,
  searchCourses,
  updateCourse,
  updateCourseImage,
  toggleCourseProperty,
  getAllCourseForSEO,
  getFreeChapterVideo,
  getFeaturedSections,
} from "../controllers/course.controllers.js";
import { compressImage, upload } from "../middlewares/multer.middlerware.js";

const router = Router();


router.route("/featured-sections").get(getFeaturedSections);
router.route("/get-courses-for-seo").get(getAllCourseForSEO);
router.route("/get-courses").get(getCourses);
router.route("/get-course-page/:slug").get(coursePage);
router.route("/free-chapter-video/:courseSlug/:chapterId").get(getFreeChapterVideo);
router.route("/get-course/:slug").get(getCourse);
router.route("/search-courses").get(searchCourses);
router.route("/get-new-courses").get(getNewCourses);
router
  .route("/get-course-all/:slug")
  .get(verifyJWTToken, verifyAdmin, getCourseall);

//  admin secure route
router
  .route("/create-course")
  .post(
    verifyJWTToken,
    verifyAdmin,
    upload.single("thumbnail"),
    compressImage,
    createCourse
  );

router
  .route("/delete-course/:slug")
  .delete(verifyJWTToken, verifyAdmin, deleteCourse);
router
  .route("/update-course-image/:slug")
  .put(
    verifyJWTToken,
    verifyAdmin,
    upload.single("thumbnail"),
    compressImage,
    updateCourseImage
  );

router
  .route("/update-course/:slug")
  .put(verifyJWTToken, verifyAdmin, updateCourse);

router
  .route("/toggle-course-property/:slug")
  .put(verifyJWTToken, verifyAdmin, toggleCourseProperty);

router.route("/draft-course").get(verifyJWTToken, verifyAdmin, DraftCourse);

export default router;
