const mongoose = require("mongoose");

const adminUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
});

//////////// Create a model for full users///////////////////////////////////
const AdminUser = mongoose.model("AdminUser", adminUserSchema, "adminusers");

module.exports = AdminUser;
