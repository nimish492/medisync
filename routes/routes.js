const express = require("express");
const router = express.Router();
const Patient = require("../models/patient");
const multer = require("multer");
const path = require("path");
const { isAdmin } = require("../middlewares/adminCheck");

// Setup multer for file upload////////////////////////////////////////////////////////////////////////////
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "public", "assets"));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// Get all patients///////////////////////////////////////////////////////////////////////////////////
router.get("/patients", async (req, res) => {
  try {
    const patients = await Patient.find();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: "Error fetching patients." });
  }
});

///////////////////////// Add a new patient////////////////////////////////////
router.post("/patients", upload.single("image"), isAdmin, async (req, res) => {
  try {
    const newPatientData = {
      name: req.body.name,
      age: req.body.age,
      symptoms: req.body.symptoms,
      diagnosis: req.body.diagnosis,
      physician: req.body.physician,
      status: req.body.status || "Off drip",
      image: req.file ? `assets/${req.file.filename}` : "assets/default.png",
    };

    const newPatient = new Patient(newPatientData);
    await newPatient.save();
    res.status(201).json(newPatient);
  } catch (error) {
    res.status(500).json({ error: "Error adding patient." });
  }
});

////////////////// Delete a patient////////////////////////////////////////
router.delete("/patients/:id", isAdmin, async (req, res) => {
  try {
    const result = await Patient.findByIdAndDelete(req.params.id);
    if (result) {
      res.json({ message: "Patient deleted successfully." });
    } else {
      res.status(404).json({ error: "Patient not found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Error deleting patient." });
  }
});

//////// search in billing ///////////////////////////////////////////
router.get("/search-patients", async (req, res) => {
  try {
    const searchTerm = req.query.q;
    const patients = await Patient.find({
      name: {
        $regex: searchTerm,
        $options: "i" /* (Case-insensitive search)*/,
      },
    }).select("name");
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: "Error searching patients." });
  }
});

//////////////display selected patient data in billing////////////////////
router.get("/patients/:id", async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (patient) {
      res.json(patient);
    } else {
      res.status(404).json({ error: "Patient not found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Error fetching patient." });
  }
});

/////////////Generate bill route///////////////////////////////
router.patch("/patients/:id", async (req, res) => {
  const patientId = req.params.id;
  const updateData = req.body;

  try {
    const result = await Patient.findByIdAndUpdate(
      patientId,
      { $set: updateData },
      { new: true }
    );
    if (!result) {
      return res.status(404).send({ error: "Patient not found" });
    }
    res.send(result);
  } catch (error) {
    console.error("Error updating patient:", error);
    res.status(500).send({ error: "Internal server error" });
  }
});

///////////////medicines routes////////////////////////////////
router.put("/patients/:id/medicines", isAdmin, async (req, res) => {
  try {
    const patientId = req.params.id;
    const updatedMedicines = req.body.medicines;

    const patient = await Patient.findByIdAndUpdate(
      patientId,
      { medicines: updatedMedicines },
      { new: true }
    );

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res
      .status(200)
      .json({ message: "Medicines updated successfully!", patient });
  } catch (error) {
    console.error("Error updating medicines:", error);
    res.status(500).json({ message: "Error updating medicines" });
  }
});

module.exports = router;
