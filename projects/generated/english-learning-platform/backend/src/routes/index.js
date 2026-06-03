const express = require("express");
const { readonlyGuard } = require("../middleware/readonlyGuard");
const authController = require("../controllers/authController");
const usersController = require("../controllers/usersController");
const progressController = require("../controllers/progressController");
const contentController = require("../controllers/contentController");
const dashboardController = require("../controllers/dashboardController");

const router = express.Router();
router.use(readonlyGuard);
router.get("/auth/session", authController.session);
router.get("/users", usersController.list);
router.get("/progress", progressController.summary);
router.get("/content", contentController.list);
router.get("/dashboard", dashboardController.summary);

module.exports = { router };
