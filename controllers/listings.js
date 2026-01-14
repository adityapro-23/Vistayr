const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });
const { setGuestFavouriteStatus } = require("../middleware");

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({}).populate("reviews");
    setGuestFavouriteStatus(allListings);
    res.render("listings/index.ejs", { allListings, currUser: req.user });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id).populate({path: "reviews", populate: {path: "author",},}).populate("owner");
    if(!listing) {
        req.flash("error", "Listing you requrested for does not exist!");
        return res.redirect("/lisings");   
    }
    res.render("listings/show.ejs", { listing, currUser: req.user });
};

module.exports.createListing = async (req, res, next) => {
    let response = await geocodingClient
    .forwardGeocode({
        query: req.body.listing.location,
        limit: 1,
    }) 
    .send()
    
    let url = req.file.path;
    let filename = req.file.filename;
    const selectedCategories = req.body.listing.category || ["Rooms"];
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = response.body.features[0].geometry;
    newListing.instantBooking = req.body.listing.instantBooking;
    
    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/lisings");   
    }; 
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    let {id} = req.params;
    let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});
    
    if(listing.location != req.body.listing.location){
        let response = await geocodingClient
        .forwardGeocode({
            query: req.body.listing.location,
            limit: 1,
        })
        .send()
        listing.location = req.body.listing.location;
        listing.geometry.coordinates = response.body.features[0].geometry.coordinates;
        await listing.save();
    }
    if(typeof req.file != "undefined"){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`)
};

module.exports.destroyListing = async (req, res) => {
    let {id} = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};

module.exports.searchListings = async (req, res) => {
    let search = req.query.search;
    if(search.trim().length > 0) {      // If search string is not empty and not just spaces
        const foundListings = await Listing.find({
            $or: [
                  { title: { $regex: search, $options: 'i' } },
                  { location: { $regex: search, $options: 'i' } },
                  { country: { $regex: search, $options: 'i' } }
                ]
        }).populate("reviews");
        setGuestFavouriteStatus(foundListings);
        return res.render("listings/index.ejs", { search, allListings: foundListings });
    }
    res.redirect("/listings");
};

module.exports.filterByCategory = async (req, res) => {
    let { category } = req.params;
    const filteredListings = await Listing.find({ category: { $in: [category] } }).populate("reviews");
    setGuestFavouriteStatus(filteredListings);
    res.render("listings/categoryWise.ejs", { filteredListings, currUser: req.user, selectedCategory: category });
};

module.exports.renderBookingForm = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if(!listing) {
        req.flash("error", "Listing you requested for does not exist!");
        return res.redirect("/listings");
    }
    res.render("listings/book.ejs", { listing, currUser: req.user });
};