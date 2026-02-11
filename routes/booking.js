const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const bookingController = require("../controllers/bookings.js")
const { isLoggedIn, saveRedirectUrl, isHost } = require("../middleware");

router.get("/", isLoggedIn, wrapAsync(bookingController.showBookings));

router.route("/:id")
    .post(isLoggedIn, saveRedirectUrl, wrapAsync(bookingController.createBooking))
    .delete(isLoggedIn, wrapAsync(bookingController.cancelBooking));

// In routes/booking.js
router.put("/:id/status", isLoggedIn, isHost, wrapAsync(bookingController.updateBookingStatus));

module.exports = router;