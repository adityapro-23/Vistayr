const { required } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

// Passport-Local-Mongoose will automatically add a username, hash and salt field to store 
// the username, the hashed password and the salt value. 
// That's why we only defined email in the user schema
const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ["host", "guest"],
        default: "guest",
    },
    wishlist: [
        {
            type: Schema.Types.ObjectId,
            ref: "Listing",
        },
    ],
    bookings: [
        {
            type: Schema.Types.ObjectId,
            ref: "Booking",
        },
    ],
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);