const Listing = require("../models/listing");
const Booking = require("../models/booking");
const User = require("../models/user");

module.exports.createBooking = async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if(new Date(startDate) < today) {
        req.flash("error", "Start date cannot be in the past!");
        return res.redirect("back");
    }

    if(startDate > endDate) {
        req.flash("error", "End date must be after start date!")
        return res.redirect("back");
    }
    const { user } = req;
    const listing = await Listing.findById(id);
    if(!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect(`${res.locals.redirectUrl}`);
    }

    //Checking for overlapping bookings
    let overlappedBookings;
    if(listing.instantBooking) {
        overlappedBookings = await Booking.find({
            listing: id,
            $and: [
                { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
                { status: { $ne: "canceled" } }
            ],
        });
    } else {
        overlappedBookings = await Booking.find({
            listing: id,
            $and: [
                { startDate: { $lte: endDate }, endDate: { $gte: startDate } },
                { status: { $eq: "confirmed" } }
            ],
        });
    }

    if (overlappedBookings.length > 0) {
        req.flash("error", "This listing is not available for the selected dates.");
        return res.redirect(`/listings/${id}`);
    }

    // Calculate total price
    const days = Math.max(
        1,
        Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
    );
    const totalPrice = days * listing.price;

    //Creating a new booking
    const newBooking = new Booking({
        listing: id,
        user: user._id,
        startDate,
        endDate,
        totalPrice,
        status: listing.instantBooking ? "confirmed" : "waiting",
    });
    await newBooking.save();

    if(listing.instantBooking) {
        user.bookings.push(newBooking._id);
        await user.save();
        listing.bookings.push(newBooking._id);
        await listing.save();
    } else {
        // Email or msg to the host about booking  
    }

    req.flash("success", listing.instantBooking ? "Booking confirmed!" : "Booking request sent to the host!");
    return res.redirect("/bookings")
};

module.exports.showBookings = async (req, res) => {
    const { user } = req;
    const bookings = await Booking.find({ user: user._id }).populate("listing").exec();
    res.render("users/bookings.ejs", { bookings });
};

module.exports.cancelBooking = async (req, res) => {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if(!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect(`${res.locals.redirectUrl}`);
    }
    booking.status = "canceled";
    await booking.save();
    
    await User.findByIdAndUpdate(booking.user, {$pull: { bookings: booking._id}});
    await Listing.findByIdAndUpdate(booking.listing, {$pull: { bookings: booking._id }});
    req.flash("success", "Booking canceled successfully!");
    res.redirect("/bookings");
};

module.exports.updateBookingStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const booking = await Booking.findById(id).populate("listing");
    
    if (!booking) {
        req.flash("error", "Booking not found!");
        return res.redirect("/host");
    }

    // Security Check: Ensure the current user owns the property
    if (!booking.listing.owner.equals(req.user._id)) {
        req.flash("error", "You do not have permission to manage this booking.");
        return res.redirect("/host");
    }

    booking.status = status;
    await booking.save();

    req.flash("success", `Booking ${status} successfully!`);
    res.redirect("/host");
};