const User = require("../models/user.js");

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};

module.exports.signup = async (req, res) => {
    try {
        let { username, email, password, role } = req.body;

        // Check: If username already exists
        const existingUsername = await User.findOne({ username });
        if(existingUsername) {
            req.flash("error", "An account with this username already exists.");
            return res.redirect("/signup");
        }

        // Check: If email already exists
        const existingEmail = User.findOne({ email });
        if(existingEmail) {
            req.flash("error", "An account with this email already exists.")
            return res.redirect("/signup");
        }

        const newUser = new User({username, email, role});
        const registeredUser = await User.register(newUser, password);
        // console.log(registeredUser);
        req.login(registeredUser, (err) => {
            if(err) {
                return next(err);
            }
            req.flash("success", "Welcome to Wanderlust!");
            return res.redirect("/listings");
        });
    } catch(e) {
        req.flash("error", e.message);
        return res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
    req.flash("success", "Welcome back to Wanderlust!");
    const redirectUrl = res.locals.redirectUrl || "/listings";
    delete req.session.redirectUrl;
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if(err) {
            return next(err);
        }
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    });
};

module.exports.showWishList = async (req, res) => {
    const user = await User.findById(req.user._id).populate("wishlist");
    return res.render("users/wishlist.ejs", { wishlist: user.wishlist });
};

module.exports.addToWishlist = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(req.user._id);

    user.wishlist.push(id);
    await user.save();
    // req.flash("success", "Listing added wishlist!");
    return res.redirect(`/listings/${id}`);
};

module.exports.removeFromWishList = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(req.user._id);
    user.wishlist = user.wishlist.filter((listingId) => listingId.toString() !== id);
    await user.save();
    const redirectUrl = req.headers.referer || "/wishlist";
    return res.redirect(redirectUrl);
};

module.exports.showDashboard = async(req, res) => {
    res.render("users/dashboard.ejs");
}

module.exports.showHelp = async(req, res) => {
    res.render("users/help.ejs")
}

module.exports.showPrivacyPolicy = async(req, res) => {
    res.render("users/privacy.ejs");
}

module.exports.showTerms = async(req, res) => {
    res.render("users/terms.ejs");
}