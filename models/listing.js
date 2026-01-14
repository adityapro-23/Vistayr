const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        url: String,
        filename: String,
    },
    price: Number,
    location: String,
    country: String,
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    geometry: {
        type: {
            type: String, // Don't do `{ location: { type: String } }`
            enum: ["Point"], // 'location.type' must be 'Point'
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true,
        },  
    },
    category: {
        type: [String], //An array of strings
        enum: [
            "Trending", 
            "Rooms",
            "Iconic cities", 
            "Mountains", 
            "Castles", 
            "Amazing Pools",
            "Camping",
            "Farms",
            "Arctic",
            "Boats",
        ],
        required: true,
    },
    bookings: [
        {
            type: Schema.Types.ObjectId,
            ref: "Booking",
        },
    ],
    instantBooking: {
        type: Boolean,
        default: false,
    },
});

//Mongoose post middleware(deletes all reviews of the listing when a listing is deleted itself)
listingSchema.post("findOneAndDelete", async (listing) => {
    if(listing) {
        await Review.deleteMany({_id: {$in: listing.reviews}})
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;