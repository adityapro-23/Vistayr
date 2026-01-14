const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const passport = require("passport");
const { saveRedirectUrl, isLoggedIn } = require("../middleware.js");

const userController = require("../controllers/users.js");

router.route("/signup")
    .get(userController.renderSignupForm)
    .post(wrapAsync(userController.signup));

router.route("/login")
    .get(userController.renderLoginForm)
    .post(saveRedirectUrl, passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }), userController.login);

router.get("/logout", userController.logout);

router.get("/wishlist", isLoggedIn, wrapAsync(userController.showWishList));
router.route("/wishlist/:id")
    .post(isLoggedIn, wrapAsync(userController.addToWishlist))
    .delete(isLoggedIn, wrapAsync(userController.removeFromWishList));

router.get("/dashboard", isLoggedIn, wrapAsync(userController.showDashboard));

router.get("/help", wrapAsync(userController.showHelp));
router.get("/privacy", wrapAsync(userController.showPrivacyPolicy));
router.get("/terms", wrapAsync(userController.showTerms));


module.exports = router;