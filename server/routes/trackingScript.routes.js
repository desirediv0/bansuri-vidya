import { Router } from "express";
import {
    getAllTrackingScripts,
    getTrackingScriptById,
    createTrackingScript,
    updateTrackingScript,
    deleteTrackingScript,
    toggleTrackingScript,
    getActiveTrackingScripts,
    updateScriptPriorities
} from "../controllers/trackingScript.controllers.js";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";

const router = Router();

// Public routes
router.route("/active").get(getActiveTrackingScripts);

// Admin routes (require authentication and admin role)
router.use(verifyJWTToken, verifyAdmin);

router.route("/")
    .get(getAllTrackingScripts)
    .post(createTrackingScript);

router.route("/priorities")
    .patch(updateScriptPriorities);

router.route("/:id")
    .get(getTrackingScriptById)
    .patch(updateTrackingScript)
    .delete(deleteTrackingScript);

router.route("/:id/toggle")
    .patch(toggleTrackingScript);


export default router;
