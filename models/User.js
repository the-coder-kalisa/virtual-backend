const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Cant be blank"]
    },
    email: {
        type: String,
        lowercase: true,
        unique: true,
        required: true,
        index: true,
    },
    password: {
        type: String,
    },
    picture:{
        type: String,
        default: ''
    },
    newMessage: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        default: "online",
    }
}, {minimize: false});
const User =  mongoose.model("Users", userSchema);
module.exports = User;