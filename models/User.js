const mongoose = require("mongoose")
const { userConnection } = require("../config/db")

const userSchema = new mongoose.Schema({
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: function () { return !this.googleId } },
    googleId: { type: String, unique: true, sparse: true },
})

const User = mongoose.model("User", userSchema)

module.exports = User