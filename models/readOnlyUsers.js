const mongoose = require("mongoose");

const readOnlyUserSchema = new mongoose.Schema({
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

const ReadOnlyUser = mongoose.model(
  "ReadOnlyUser",
  readOnlyUserSchema,
  "readonlyusers"
);

module.exports = ReadOnlyUser;
