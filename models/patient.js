const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  name: String,
  age: Number,
  symptoms: String,
  diagnosis: String,
  physician: String,
  status: { type: String, default: "Off drip" },
  image: { type: String, default: "./public/assets/default.png" },
  medicines: [
    {
      name: String,
      dosage: String,
    },
  ],
});

const Patient = mongoose.model("Patient", patientSchema);
module.exports = Patient;
