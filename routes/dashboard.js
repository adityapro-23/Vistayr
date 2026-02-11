const express = require("express");
const router = express.Router();
const { isLoggedIn, isHost } = require("../middleware");
const dashboardController = require("../controllers/dashboard");
const wrapAsync = require("../utils/wrapAsync");

// Render the Dashboard Page
router.get("/", isLoggedIn, isHost, wrapAsync(dashboardController.renderDashboard));

// API Endpoint for AJAX (The "Real-time" part)
router.get("/api/stats", isLoggedIn, isHost, wrapAsync(dashboardController.getDashboardStats));

module.exports = router;