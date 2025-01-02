const mongoose = require("mongoose");

// Define the User schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Ensure the username is unique
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
});

// No need for pre-save hashing or password comparison method
const User = mongoose.model("User", userSchema, "users");

module.exports = User;
