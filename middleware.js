const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError");
const { listingSchema, reviewSchema } = require("./schema");

module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()) {
        // req.session.redirectUrl = req.originalUrl;   // redirects to /wishlist/:id
        req.session.redirectUrl = req.headers.referer;
        req.flash("error", "You must be logged in to perform this action!");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl) {
       res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async (req, res, next) => {
    let {id} = req.params;
    let listing = await Listing.findById(id);
    if(!listing.owner._id.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the owner of this listing.");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.validateListing = (req, res, next) => {
    // Convert instantBooking to boolean before validation
    if (req.body.listing && req.body.listing.instantBooking !== undefined) {
        req.body.listing.instantBooking = req.body.listing.instantBooking === 'true' || req.body.listing.instantBooking === 'on';
    } else if (req.body.listing) {
        req.body.listing.instantBooking = false;  // Default to false if not provided
    }
    
    let {error} = listingSchema.validate(req.body);
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

module.exports.validateReview = (req, res, next) => {
    let {error} = reviewSchema.validate(req.body);
    if(error) {
        let errMsg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(400, errMsg);
    } else {
        next();
    }
};

module.exports.isReviewAuthor = async (req, res, next) => {
    let {id, reviewID} = req.params;
    let review = await Review.findById(reviewID);
    if(!review.author._id.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the author of this review.");
        return res.redirect(`/listings/${id}`);
    }
    next();
};

module.exports.setGuestFavouriteStatus = (listings) => {
    listings.forEach(listing => {
        const totalReviews = listing.reviews.length;
        const fiveStarReviews = listing.reviews.filter(review => review.rating === 5).length;
        const fourStarOrHigherReviews = listing.reviews.filter(review => review.rating >= 4).length;

        listing.isGuestFavourite = totalReviews > 0 && (
            (fiveStarReviews / totalReviews) >= 0.5 || // More than 50% 5-star reviews
            (fourStarOrHigherReviews / totalReviews) >= 0.65 // More than 65% 4-star or higher reviews
        );
    });
};

module.exports.isHost = (req, res, next) => {
    if(!req.user || req.user.role !== "host") {
        req.flash("error", "You do not have permission to perform this action.");
        return res.redirect("/listings");
    }
    next();
};